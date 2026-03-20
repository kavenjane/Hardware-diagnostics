require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const evaluateDevice = require("./services/evaluateDevice");
const SystemMonitor = require("./services/systemMonitor");

const app = express();
const IS_SERVERLESS =
  process.env.VERCEL === "1" ||
  process.env.VERCEL === "true" ||
  Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
const server = IS_SERVERLESS ? null : http.createServer(app);
const wss = IS_SERVERLESS ? null : new WebSocket.Server({ server });
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ---- In-memory state (for now) ----
let processing = false;
let lastReport = null;
let lastMetrics = null;
let activityLog = []; // Store activity events for live graph
let monitoringInterval = null;
const connectedClients = new Set();

const OCR_SPACE_ENDPOINT = "https://api.ocr.space/parse/image";
const GOOGLE_VISION_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";
const OPENAI_CHAT_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const GROQ_CHAT_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

function getApiKey(req, envName, headerName) {
  const fromHeader = req.get(headerName);
  if (typeof fromHeader === "string" && fromHeader.trim()) {
    return fromHeader.trim();
  }
  const fromEnv = process.env[envName];
  return typeof fromEnv === "string" ? fromEnv.trim() : "";
}

// ---- Real-time monitoring ----
function startLiveMonitoring() {
  if (monitoringInterval) return;

  monitoringInterval = setInterval(async () => {
    try {
      const metrics = await SystemMonitor.getSystemMetrics();
      if (metrics) {
        const report = evaluateDevice(metrics);
        lastReport = report;
        lastMetrics = metrics;

        const activity = {
          timestamp: metrics.timestamp,
          type: "monitoring",
          cpu_usage: metrics.cpu_usage,
          ram_gb: metrics.ram_gb,
          storage_health: metrics.storage_health,
          battery_health: metrics.battery_health
        };
        activityLog.push(activity);

        if (activityLog.length > 100) {
          activityLog.shift();
        }

        // Broadcast to all connected WebSocket clients
        const message = JSON.stringify({
          type: "evaluation",
          data: report,
          metrics
        });

        connectedClients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    } catch (error) {
      console.error("Error in live monitoring:", error.message);
    }
  }, 2000); // Update every 2 seconds
}

function stopLiveMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

// ---- WebSocket connection handling ----
if (wss) {
  wss.on("connection", (ws) => {
    connectedClients.add(ws);
    console.log("Client connected. Total clients:", connectedClients.size);

  // Send current data immediately
  if (lastReport) {
    ws.send(
      JSON.stringify({
        type: "evaluation",
        data: lastReport,
        metrics: lastMetrics
      })
    );
  }

  // Start monitoring if this is the first client
  if (connectedClients.size === 1) {
    startLiveMonitoring();
  }

    ws.on("close", () => {
      connectedClients.delete(ws);
      console.log("Client disconnected. Total clients:", connectedClients.size);

    // Stop monitoring if no clients
    if (connectedClients.size === 0) {
      stopLiveMonitoring();
    }
  });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error.message);
    });
  });
}

// ---- Submit diagnostics (from script) ----
app.post("/api/submit-diagnostics", (req, res) => {
  processing = true;

  const input = req.body;
  lastMetrics = input;

  // Log activity
  const activity = {
    timestamp: new Date().toISOString(),
    type: "submission",
    cpu_usage: input.cpu_usage,
    ram_gb: input.ram_gb,
    storage_health: input.storage_health,
    battery_health: input.battery_health
  };
  activityLog.push(activity);

  // Keep only last 100 activities
  if (activityLog.length > 100) {
    activityLog.shift();
  }

  // Use real device evaluation with health rules
  const report = evaluateDevice(input);

  // simulate processing delay
  setTimeout(() => {
    lastReport = report;
    processing = false;
  }, 3000);

  res.json({ status: "received" });
});

// ---- Activity graph data ----
app.get("/api/activity", (req, res) => {
  res.json(activityLog);
});

// ---- Live graph page ----
app.get("/graph", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Live Activity Graph</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #0B1220 0%, #1F2A44 100%);
          color: #E8EAED;
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        header {
          margin-bottom: 30px;
        }
        h1 {
          font-size: 32px;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #9AA0A6;
          font-size: 14px;
        }
        .chart-container {
          background: #1F2A44;
          border: 1px solid #2F81F7;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .chart-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 15px;
          color: #E8EAED;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: #0B1220;
          border: 1px solid #2F81F7;
          border-radius: 6px;
          padding: 15px;
          text-align: center;
        }
        .stat-label {
          color: #9AA0A6;
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #2F81F7;
        }
        .refresh-info {
          text-align: center;
          color: #9AA0A6;
          font-size: 12px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>📊 Live Activity Monitor</h1>
          <p class="subtitle">Real-time diagnostic activity and system metrics</p>
        </header>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total Activities</div>
            <div class="stat-value" id="totalActivities">0</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg CPU Usage</div>
            <div class="stat-value" id="avgCpu">--</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg RAM (GB)</div>
            <div class="stat-value" id="avgRam">--</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg Storage</div>
            <div class="stat-value" id="avgStorage">--</div>
          </div>
        </div>

        <div class="chart-container">
          <div class="chart-title">CPU Usage Over Time</div>
          <canvas id="cpuChart"></canvas>
        </div>

        <div class="chart-container">
          <div class="chart-title">RAM & Storage Metrics</div>
          <canvas id="ramStorageChart"></canvas>
        </div>

        <div class="chart-container">
          <div class="chart-title">Battery Health Over Time</div>
          <canvas id="batteryChart"></canvas>
        </div>

        <div class="refresh-info">
          ⚡ Updates every 2 seconds
        </div>
      </div>

      <script>
        const cpuCtx = document.getElementById('cpuChart').getContext('2d');
        const ramStorageCtx = document.getElementById('ramStorageChart').getContext('2d');
        const batteryCtx = document.getElementById('batteryChart').getContext('2d');

        const chartOptions = {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              labels: {
                color: '#E8EAED'
              }
            },
            filler: true
          },
          scales: {
            y: {
              grid: { color: 'rgba(47, 129, 247, 0.1)' },
              ticks: { color: '#9AA0A6' }
            },
            x: {
              grid: { color: 'rgba(47, 129, 247, 0.1)' },
              ticks: { color: '#9AA0A6' }
            }
          }
        };

        let cpuChart = new Chart(cpuCtx, {
          type: 'line',
          data: { labels: [], datasets: [] },
          options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: 100 } } }
        });

        let ramStorageChart = new Chart(ramStorageCtx, {
          type: 'line',
          data: { labels: [], datasets: [] },
          options: chartOptions
        });

        let batteryChart = new Chart(batteryCtx, {
          type: 'line',
          data: { labels: [], datasets: [] },
          options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: 100 } } }
        });

        async function fetchActivityData() {
          try {
            const response = await fetch('http://localhost:3000/api/activity');
            const data = await response.json();

            if (data.length === 0) return;

            // Process data
            const timestamps = data.map((d, i) => i);
            const cpuData = data.map(d => d.cpu_usage);
            const ramData = data.map(d => d.ram_gb);
            const storageData = data.map(d => d.storage_health);
            const batteryData = data.map(d => d.battery_health);

            // Update stats
            document.getElementById('totalActivities').textContent = data.length;
            document.getElementById('avgCpu').textContent = Math.round(cpuData.reduce((a, b) => a + b, 0) / cpuData.length) + '%';
            document.getElementById('avgRam').textContent = (ramData.reduce((a, b) => a + b, 0) / ramData.length).toFixed(1);
            document.getElementById('avgStorage').textContent = Math.round(storageData.reduce((a, b) => a + b, 0) / storageData.length) + '%';

            // Update CPU chart
            cpuChart.data.labels = timestamps;
            cpuChart.data.datasets = [{
              label: 'CPU Usage (%)',
              data: cpuData,
              borderColor: '#2F81F7',
              backgroundColor: 'rgba(47, 129, 247, 0.1)',
              fill: true,
              tension: 0.4
            }];
            cpuChart.update();

            // Update RAM & Storage chart
            ramStorageChart.data.labels = timestamps;
            ramStorageChart.data.datasets = [
              {
                label: 'RAM (GB)',
                data: ramData,
                borderColor: '#34A853',
                backgroundColor: 'rgba(52, 168, 83, 0.1)',
                fill: true,
                tension: 0.4
              },
              {
                label: 'Storage Health (%)',
                data: storageData,
                borderColor: '#FBBC04',
                backgroundColor: 'rgba(251, 188, 4, 0.1)',
                fill: true,
                tension: 0.4
              }
            ];
            ramStorageChart.update();

            // Update Battery chart
            batteryChart.data.labels = timestamps;
            batteryChart.data.datasets = [{
              label: 'Battery Health (%)',
              data: batteryData,
              borderColor: '#EA4335',
              backgroundColor: 'rgba(234, 67, 53, 0.1)',
              fill: true,
              tension: 0.4
            }];
            batteryChart.update();
          } catch (error) {
            console.error('Error fetching activity data:', error);
          }
        }

        // Initial load
        fetchActivityData();

        // Refresh every 2 seconds
        setInterval(fetchActivityData, 2000);
      </script>
    </body>
    </html>
  `);
});

// ---- Processing status (frontend checks this) ----
app.get("/api/status", (req, res) => {
  res.json({
    processing,
    hasResult: !!lastReport
  });
});

// ---- Results (frontend reads this) ----
app.get("/api/diagnostics", (req, res) => {
  if (!lastReport) {
    return res.status(404).json({ error: "No report yet" });
  }
  res.json(lastReport);
});

// ---- Individual component health detail ----
app.get("/api/component/:name", (req, res) => {
  if (!lastReport) {
    return res.status(404).json({ error: "No report yet" });
  }
  const name = req.params.name.toLowerCase();
  const validComponents = ["cpu", "ram", "storage", "battery"];
  if (!validComponents.includes(name)) {
    return res.status(400).json({ error: `Invalid component: ${name}. Valid: ${validComponents.join(", ")}` });
  }
  const breakdown = lastReport.componentBreakdowns?.[name];
  if (!breakdown) {
    return res.status(404).json({ error: `No breakdown data for ${name}` });
  }
  res.json({
    component: breakdown,
    overallHealth: lastReport.overall?.health,
    overallScore: lastReport.overall?.total_score
  });
});

// ---- Reusability summary ----
app.get("/api/reusability", (req, res) => {
  if (!lastReport) {
    return res.status(404).json({ error: "No report yet" });
  }
  res.json(lastReport.reusabilitySummary || { error: "No reusability data" });
});

function stripDataUrlPrefix(imageBase64 = "") {
  const marker = "base64,";
  const markerIndex = imageBase64.indexOf(marker);
  if (markerIndex === -1) return imageBase64.trim();
  return imageBase64.slice(markerIndex + marker.length).trim();
}

function isLikelyBase64(content = "") {
  return /^[A-Za-z0-9+/=\s]+$/.test(content);
}

async function extractTextWithGoogleVision(rawImageBase64, apiKey) {
  if (!apiKey) {
    throw new Error("GOOGLE_VISION_API_KEY not set");
  }

  const visionResponse = await fetch(
    `${GOOGLE_VISION_ENDPOINT}?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requests: [
          {
            image: { content: rawImageBase64 },
            features: [{ type: "TEXT_DETECTION" }]
          }
        ]
      })
    }
  );

  const payload = await visionResponse.json();
  if (!visionResponse.ok) {
    const message = payload?.error?.message || "Google Vision OCR failed";
    throw new Error(message);
  }

  const response = payload?.responses?.[0] || {};
  if (response?.error?.message) {
    throw new Error(response.error.message);
  }

  const text =
    response?.fullTextAnnotation?.text ||
    response?.textAnnotations?.[0]?.description ||
    "";

  return text.trim();
}

async function extractTextWithOcrSpace(imageBase64, fileName, apiKey) {
  if (!apiKey) {
    throw new Error("OCR_SPACE_API_KEY not set");
  }

  const params = new URLSearchParams();
  params.append("apikey", apiKey);
  params.append("base64Image", imageBase64);
  params.append("language", "eng");
  params.append("OCREngine", "2");
  if (fileName) params.append("fileName", fileName);

  const ocrResponse = await fetch(OCR_SPACE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  const payload = await ocrResponse.json();
  if (!ocrResponse.ok || payload?.IsErroredOnProcessing) {
    const message = payload?.ErrorMessage?.[0] || payload?.ErrorDetails || "OCR Space failed";
    throw new Error(message);
  }

  const text = (payload?.ParsedResults || [])
    .map((result) => result.ParsedText || "")
    .join("\n")
    .trim();

  return text;
}

// ---- OCR proxy (privacy-first: process and discard) ----
app.post("/api/ocr", async (req, res) => {
  try {
    const { imageBase64, fileName, provider = "auto" } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    const selectedProvider = String(provider).toLowerCase();
    if (!["auto", "google", "ocr_space"].includes(selectedProvider)) {
      return res.status(400).json({ error: "provider must be one of: auto, google, ocr_space" });
    }

    const rawImageBase64 = stripDataUrlPrefix(imageBase64);
    if (!rawImageBase64 || !isLikelyBase64(rawImageBase64)) {
      return res.status(400).json({ error: "imageBase64 must contain valid base64 image content" });
    }

    let text = "";
    let usedProvider = selectedProvider;
    const providerErrors = [];

    const googleVisionApiKey = getApiKey(req, "GOOGLE_VISION_API_KEY", "x-google-vision-api-key");
    const ocrSpaceApiKey = getApiKey(req, "OCR_SPACE_API_KEY", "x-ocr-space-api-key");

    const canUseGoogle = Boolean(googleVisionApiKey);
    const canUseOcrSpace = Boolean(ocrSpaceApiKey);

    if (!canUseGoogle && !canUseOcrSpace) {
      return res.status(500).json({
        error: "No OCR provider configured. Set GOOGLE_VISION_API_KEY or OCR_SPACE_API_KEY"
      });
    }

    if ((selectedProvider === "google" || selectedProvider === "auto") && canUseGoogle) {
      try {
        text = await extractTextWithGoogleVision(rawImageBase64, googleVisionApiKey);
        usedProvider = "google";
      } catch (googleError) {
        providerErrors.push(`google: ${googleError.message}`);
        if (selectedProvider === "google") {
          return res.status(502).json({ error: googleError.message });
        }
      }
    }

    if (!text && (selectedProvider === "ocr_space" || selectedProvider === "auto") && canUseOcrSpace) {
      try {
        text = await extractTextWithOcrSpace(imageBase64, fileName, ocrSpaceApiKey);
        usedProvider = "ocr_space";
      } catch (ocrSpaceError) {
        providerErrors.push(`ocr_space: ${ocrSpaceError.message}`);
        if (selectedProvider === "ocr_space") {
          return res.status(502).json({ error: ocrSpaceError.message });
        }
      }
    }

    if (!text) {
      return res.status(502).json({
        error: "OCR failed for all available providers",
        details: providerErrors
      });
    }

    return res.json({
      text,
      provider: usedProvider,
      ...(providerErrors.length > 0 ? { warnings: providerErrors } : {})
    });
  } catch (error) {
    console.error("OCR error:", error.message);
    return res.status(500).json({ error: "OCR request failed" });
  }
});

// ---- Fix suggestions from OCR text ----
app.post("/api/fix-suggestions", async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }

    const openaiApiKey = getApiKey(req, "OPENAI_API_KEY", "x-openai-api-key");

    if (!openaiApiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY not set" });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const systemPrompt =
      "You are a hardware support assistant. Provide concise, safe installation and fixing steps based on OCR text from device labels or serial/model numbers. Avoid unsafe actions and be clear about any missing info.";

    const openaiResponse = await fetch(OPENAI_CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `OCR text:\n${text}\n\nTask: Provide installation tips and common fixes for the identified device. If model is unclear, ask for one missing detail.`
          }
        ],
        temperature: 0.2,
        max_tokens: 350
      })
    });

    const payload = await openaiResponse.json();
    if (!openaiResponse.ok) {
      const message = payload?.error?.message || "Suggestion request failed";
      return res.status(502).json({ error: message });
    }

    const suggestions = payload?.choices?.[0]?.message?.content?.trim() || "";
    return res.json({ suggestions });
  } catch (error) {
    console.error("Suggestion error:", error.message);
    return res.status(500).json({ error: "Suggestion request failed" });
  }
});

// ---- AI human-readable report summary ----
app.post("/api/ai-report-summary", async (req, res) => {
  try {
    const { report } = req.body || {};

    if (!report || typeof report !== "object") {
      return res.status(400).json({ error: "report object is required" });
    }

    const groqApiKey = getApiKey(req, "GROQ_API_KEY", "x-groq-api-key");

    if (!groqApiKey) {
      return res.status(503).json({ error: "GROQ_API_KEY not set" });
    }

    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    const systemPrompt =
      "You are a hardware diagnostics assistant. Convert technical evaluation data into a concise, human-understandable explanation. Keep it practical, clear, and non-alarmist.";

    const userPrompt = [
      "Given this hardware diagnostics report JSON, produce:",
      "1) a plain-language summary for a non-technical user (2-4 short sentences)",
      "2) top 3 actionable next steps",
      "3) one-line final recommendation",
      "Return as JSON with keys: summary, nextSteps (array), recommendation.",
      "",
      JSON.stringify(report)
    ].join("\n");

    const groqResponse = await fetch(GROQ_CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 350
      })
    });

    const payload = await groqResponse.json();
    if (!groqResponse.ok) {
      const message = payload?.error?.message || "AI summary request failed";
      return res.status(502).json({ error: message });
    }

    const content = payload?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return res.status(502).json({ error: "AI returned empty summary" });
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) {
        return res.status(502).json({ error: "AI summary parsing failed" });
      }
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        return res.status(502).json({ error: "AI summary parsing failed" });
      }
    }

    return res.json({
      summary: parsed.summary || "",
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      recommendation: parsed.recommendation || ""
    });
  } catch (error) {
    console.error("AI report summary error:", error.message);
    return res.status(500).json({ error: "AI report summary request failed" });
  }
});

// ---- AI chat over current report (Groq) ----
app.post("/api/ai-chat", async (req, res) => {
  try {
    const { report, message, history } = req.body || {};

    if (!report || typeof report !== "object") {
      return res.status(400).json({ error: "report object is required" });
    }

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const groqApiKey = getApiKey(req, "GROQ_API_KEY", "x-groq-api-key");

    if (!groqApiKey) {
      return res.status(503).json({ error: "GROQ_API_KEY not set" });
    }

    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    const systemPrompt = [
      "You are a hardware diagnostics assistant.",
      "Answer in clear, simple language for non-technical users.",
      "Use only the provided report context; if info is missing, say so.",
      "Keep answers concise and practical."
    ].join(" ");

    const sanitizedHistory = Array.isArray(history)
      ? history
          .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
          .slice(-8)
      : [];

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Report context JSON:\n${JSON.stringify(report)}` },
      ...sanitizedHistory,
      { role: "user", content: String(message).trim() }
    ];

    const groqResponse = await fetch(GROQ_CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 450
      })
    });

    const payload = await groqResponse.json();
    if (!groqResponse.ok) {
      const messageText = payload?.error?.message || "AI chat request failed";
      return res.status(502).json({ error: messageText });
    }

    const answer = payload?.choices?.[0]?.message?.content?.trim() || "";
    if (!answer) {
      return res.status(502).json({ error: "AI returned empty response" });
    }

    return res.json({ answer });
  } catch (error) {
    console.error("AI chat error:", error.message);
    return res.status(500).json({ error: "AI chat request failed" });
  }
});

// ---- Health check ----
app.get("/", (req, res) => {
  res.send("Backend running");
});

if (!IS_SERVERLESS && require.main === module) {
  server.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
  });
}

module.exports = app;
