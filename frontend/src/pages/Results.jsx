import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import StandardizedScoreCard from "../components/StandardizedScoreCard";
import LiveMonitor from "../components/LiveMonitor";
import CategoryBadge from "../components/CategoryBadge";
import useLiveEvaluation from "../hooks/useLiveEvaluation";
import { buildApiUrl } from "../utils/apiBase";
import { getApiHeaders } from "../utils/runtimeKeys";

const hashString = (value = "") => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return String(hash);
};

export default function Results() {
  const navigate = useNavigate();
  const { evaluation, connectionStatus, lastUpdate, error, isConnected } = useLiveEvaluation();
  const [lockedEvaluation, setLockedEvaluation] = useState(null);
  const data = lockedEvaluation || evaluation;
  const [aiSummary, setAiSummary] = useState(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const aiSummaryRequestedRef = useRef(false);
  const lastChatRequestRef = useRef({ question: "", at: 0 });

  const refreshLockedData = () => {
    setLockedEvaluation(evaluation || null);
    setAiSummary(null);
    setAiSummaryError(null);
    setChatMessages([]);
    setChatError(null);
    aiSummaryRequestedRef.current = false;
  };

  useEffect(() => {
    if (!lockedEvaluation && evaluation) {
      setLockedEvaluation(evaluation);
    }
  }, [evaluation, lockedEvaluation]);

  const buildFullReportSummary = () => {
    if (!data) {
      return {
        title: "No data available",
        detectionItems: [],
        finalSummary: "Run diagnostics first to generate a complete summary."
      };
    }

    if (data.standardized) {
      const standardized = data.standardized;
      const categories = Object.values(standardized.categories || {});
      const weakestCategory = categories.length
        ? categories.reduce((min, current) => (current.percentage < min.percentage ? current : min), categories[0])
        : null;

      const topActions = (standardized.recommendedActions || []).slice(0, 3);
      const detectionItems = [
        `Classification detected: ${standardized.classification.level}`,
        `Overall score detected: ${standardized.totalScore}/100`,
        weakestCategory
          ? `Primary risk detected in ${weakestCategory.label} (${weakestCategory.score}/${weakestCategory.maxScore})`
          : "No category-level risk details available"
      ];

      if (topActions.length > 0) {
        detectionItems.push(...topActions.map((action) => `Action: ${action.action} (${action.priority})`));
      }

      return {
        title: "Standardized scan and detection summary",
        detectionItems,
        finalSummary: `This device is classified as ${standardized.classification.level}. The report indicates a total of ${standardized.totalScore}/100 with recommended next steps focused on ${weakestCategory?.label || "core hardware stability"}.`
      };
    }

    const components = data.components || {};
    const poorComponents = Object.entries(components).filter(([, value]) => value.health === "POOR");
    const fairComponents = Object.entries(components).filter(([, value]) => value.health === "FAIR");

    const detectionItems = [
      `Overall health detected: ${data.overall.health}`,
      `Overall score detected: ${data.overall.total_score}/100`,
      `Poor components detected: ${poorComponents.length}`,
      `Fair components detected: ${fairComponents.length}`,
      `Reusable status detected: ${data.overall.reusable ? "YES" : "NO"}`
    ];

    return {
      title: "Legacy scan and detection summary",
      detectionItems,
      finalSummary: poorComponents.length > 0
        ? `The report identifies ${poorComponents.length} critical component(s) requiring replacement or repair before reliable reuse.`
        : `The report indicates no critical component failures, with ${fairComponents.length} component(s) needing monitoring or minor upgrades.`
    };
  };

  const reportSnapshotKey = data ? hashString(JSON.stringify(data)) : null;

  const askAiQuestion = async () => {
    const question = chatInput.trim();
    if (!question || chatLoading || !data) return;

    const now = Date.now();
    const normalized = question.toLowerCase();
    if (
      lastChatRequestRef.current.question === normalized &&
      now - lastChatRequestRef.current.at < 8000
    ) {
      setChatError("Please wait a few seconds before sending the same question again.");
      return;
    }

    lastChatRequestRef.current = { question: normalized, at: now };

    const endpoint = buildApiUrl("/api/ai-chat");
    const historyForApi = chatMessages.slice(-8).map((msg) => ({ role: msg.role, content: msg.content }));

    setChatMessages((prev) => [...prev, { role: "user", content: question }]);
    setChatInput("");
    setChatLoading(true);
    setChatError(null);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getApiHeaders() },
        body: JSON.stringify({ report: data, message: question, history: historyForApi })
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Unable to get AI response");

      setChatMessages((prev) => [...prev, { role: "assistant", content: payload.answer || "No answer received." }]);
    } catch (err) {
      setChatError(err.message || "Unable to get AI response");
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (!data) {
      setAiSummary(null);
      setAiSummaryError(null);
      setChatMessages([]);
      setChatError(null);
      aiSummaryRequestedRef.current = false;
      return;
    }

    if (aiSummaryRequestedRef.current) {
      return;
    }
    aiSummaryRequestedRef.current = true;

    if (reportSnapshotKey) {
      try {
        const cached = sessionStorage.getItem(`ai-summary:${reportSnapshotKey}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setAiSummary(parsed);
          setAiSummaryError(null);
          setAiSummaryLoading(false);
          return;
        }
      } catch {
        // ignore cache parse errors and continue with network request
      }
    }

    const endpoint = buildApiUrl("/api/ai-report-summary");
    let cancelled = false;

    setAiSummaryLoading(true);
    setAiSummaryError(null);

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getApiHeaders() },
      body: JSON.stringify({ report: data })
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.error || "AI summary unavailable");
        return payload;
      })
      .then((payload) => {
        if (cancelled) return;
        const summaryPayload = {
          summary: payload.summary || "",
          nextSteps: Array.isArray(payload.nextSteps) ? payload.nextSteps : [],
          recommendation: payload.recommendation || ""
        };

        setAiSummary(summaryPayload);

        if (reportSnapshotKey) {
          try {
            sessionStorage.setItem(`ai-summary:${reportSnapshotKey}`, JSON.stringify(summaryPayload));
          } catch {
            // ignore storage quota errors
          }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setAiSummaryError(err.message || "AI summary unavailable");
      })
      .finally(() => {
        if (cancelled) return;
        setAiSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [data, reportSnapshotKey]);

  const downloadReport = () => {
    if (!data) return;
    
    let reportContent = `STANDARDIZED HARDWARE REUSABILITY EVALUATION REPORT
Generated: ${new Date().toLocaleString()}

================================================================================`;

    if (data.standardized) {
      const { standardized } = data;
      reportContent += `

EVALUATION MODEL: STANDARDIZED HARDWARE REUSABILITY (Professional Grade)

OVERALL ASSESSMENT
==================
Total Score: ${standardized.totalScore}/100
Classification: ${standardized.classification.level}
Description: ${standardized.classification.description}

CATEGORY BREAKDOWN
==================`;
      
      Object.entries(standardized.categories).forEach(([key, cat]) => {
        reportContent += `
${cat.label.toUpperCase()}: ${cat.score}/${cat.maxScore} (${cat.percentage}%)`;
      });

      if (standardized.recommendedActions && standardized.recommendedActions.length > 0) {
        reportContent += `

RECOMMENDATIONS
===============`;
        standardized.recommendedActions.forEach((action) => {
          reportContent += `
[${action.priority}] ${action.action}
${action.description}`;
        });
      }
    } else {
      reportContent += `

EVALUATION MODEL: LEGACY COMPONENT HEALTH

OVERALL SUMMARY
===============
Health Status: ${data.overall.health}
Health Score: ${data.overall.total_score}/100
Reusable: ${data.overall.reusable ? "YES" : "NO"}

HARDWARE MODULE STATUS
======================
${Object.entries(data.components)
  .map(([key, value]) => `${key.toUpperCase()}: ${value.health} (Score: ${value.score})`)
  .join('\n')}`;
    }

    reportContent += `

================================================================================
Generated by Hardware Diagnostic System`;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `evaluation-report-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadInsights = () => {
    const insightsContent = `AI-GENERATED HEALTH INSIGHTS
Generated: ${new Date().toLocaleString()}

=================================

OVERALL STATUS: ${data.overall.health}

LIFESPAN & SUSTAINABILITY:
- Estimated Remaining Life: ${data.overall.longevity_years} years
- Sustainability: ${data.overall.sustainability}
- Reusable: ${data.overall.reusable ? "YES" : "NO"}

COMPONENT BREAKDOWN:
${Object.entries(data.components)
  .map(([key, value]) => `- ${key.toUpperCase()}: ${value.health}`)
  .join('\n')}

RECOMMENDATIONS:
- Review components showing FAIR or POOR status
- Monitor system performance regularly
- Schedule maintenance as needed

---
Generated by Device Health Monitor`;

    const blob = new Blob([insightsContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `health-insights-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="container">
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ color: "#EF4444", fontSize: 16, fontWeight: 600 }}>⚠️ Error</p>
          <p className="muted">{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
            style={{ marginTop: 16 }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container">
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{
            width: 48,
            height: 48,
            border: "3px solid #1F2A44",
            borderTopColor: "#2F81F7",
            borderRadius: "50%",
            margin: "0 auto 20px",
            animation: "spin 1.2s linear infinite"
          }} />
          <p className="muted">Loading evaluation report…</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Determine which evaluation model to display
  const hasStandardized = data.standardized !== undefined;
  const hasLegacy = data.components !== undefined;
  const fullReportSummary = buildFullReportSummary();

  return (
    <div className="container">
      {/* Header with Live Monitor */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 24 }}>
          <div>
            <p className="label">HARDWARE EVALUATION REPORT</p>
            <h1 style={{ fontSize: 32, margin: "8px 0 0 0" }}>
              {hasStandardized ? "Standardized Reusability Evaluation" : "Legacy Health Report"}
            </h1>
            <p className="muted" style={{ marginTop: 8 }}>
              Generated {new Date().toLocaleString()}
            </p>
          </div>
          <button className="btn btn-primary" style={{ whiteSpace: "nowrap" }} onClick={downloadReport}>
            ⬇ Download Report
          </button>
        </div>

        {/* Live Monitor */}
        {hasStandardized && (
          <LiveMonitor
            evaluation={data}
            lastUpdate={lastUpdate}
            isConnected={isConnected}
            connectionStatus={connectionStatus}
          />
        )}
      </div>

      {/* Standardized Evaluation Display */}
      {hasStandardized && (
        <div style={{ marginBottom: 60 }}>
          <StandardizedScoreCard evaluation={data} />
        </div>
      )}

      {/* Legacy Evaluation Display */}
      {hasLegacy && !hasStandardized && (
        <>
          {/* Overall summary */}
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 24, marginBottom: 40 }}
          >
            <div className="card">
              <p className="label">OVERALL DEVICE HEALTH</p>
              <h2 style={{ marginTop: 12, fontSize: 28 }}>
                {data.overall.health}
              </h2>
            </div>

            <div className="card">
              <p className="label">HEALTH SCORE</p>
              <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 8 }}>
                <h2 style={{ fontSize: 28, margin: 0 }}>{data.overall.total_score}</h2>
                <span className="muted" style={{ fontSize: 18 }}>/100</span>
              </div>
            </div>

            <div className="card">
              <p className="label">EST. REMAINING LIFE</p>
              <h2 style={{ marginTop: 12, fontSize: 28 }}>{data.overall.longevity_years || "N/A"}</h2>
              <p className="muted" style={{ marginTop: 6 }}>Based on current health</p>
            </div>

            <div className="card">
              <p className="label">SUSTAINABILITY</p>
              <h2 style={{ marginTop: 12, fontSize: 28 }}>{data.overall.sustainability}</h2>
              <p className="muted" style={{ marginTop: 6 }}>
                Reusable: {data.overall.reusable ? "YES" : "NO"}
              </p>
            </div>
          </div>

          {/* Reusability Summary */}
          {data.reusabilitySummary && (
            <div className="card" style={{ marginBottom: 40, borderLeft: "4px solid #2F81F7" }}>
              <p className="label">♻️ REUSABILITY SUMMARY</p>
              <p style={{ marginTop: 12, fontSize: 16 }}>
                <strong>{data.reusabilitySummary.reusableCount}</strong> out of {data.reusabilitySummary.totalComponents} components are reusable.
              </p>
              <div style={{ marginTop: 16 }}>
                {data.reusabilitySummary.breakdown.map((item, i) => (
                  <div key={i} style={{ marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: item.reusable ? "#10B981" : "#EF4444", marginRight: 8 }}>
                      {item.reusable ? "✅" : "❌"}
                    </span>
                    <strong>{item.component.toUpperCase()}</strong>: {item.verdict}
                    <span className="muted" style={{ marginLeft: 8, fontSize: 11 }}>({item.confidence}% confidence)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Components */}
          <h2 style={{ marginBottom: 24 }}>Hardware Module Status</h2>

          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            {Object.entries(data.components).map(([key, value]) => {
              const breakdown = data.componentBreakdowns?.[key];
              return (
                <div
                  className="card component-card clickable-card"
                  key={key}
                  onClick={() => navigate(`/component/${key}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <p className="label" style={{ margin: 0 }}>{key.toUpperCase()}</p>
                  </div>
                  <p style={{ margin: "8px 0", fontSize: 14, fontWeight: 600 }}>{value.health}</p>
                  <p className="muted" style={{ margin: "4px 0", fontSize: 12 }}>Score: {value.score.toFixed(2)}</p>
                  <p className="muted" style={{ fontSize: 10, marginTop: 12 }}>Click for details →</p>
                </div>
              );
            })}

            <div
              className="card component-card clickable-card"
              onClick={() => navigate("/dashboard")}
              role="button"
              tabIndex={0}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p className="label" style={{ margin: 0 }}>OTHER COMPONENTS</p>
              </div>
              <p style={{ margin: "8px 0", fontSize: 14, fontWeight: 600 }}>View extended modules</p>
              <p className="muted" style={{ margin: "4px 0", fontSize: 12 }}>GPU, Display, I/O, Motherboard</p>
              <p className="muted" style={{ fontSize: 10, marginTop: 12 }}>Click for details →</p>
            </div>
          </div>
        </>
      )}

      {/* Detailed Category Breakdown for Standardized */}
      {hasStandardized && data.standardized.categories && (
        <>
          <h2 style={{ marginBottom: 24, marginTop: 60 }}>Detailed Category Analysis</h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {Object.entries(data.standardized.categories).map(([key, category]) => (
              <CategoryBadge
                key={key}
                category={category.label}
                score={category.score}
                maxScore={category.maxScore}
                details={category.details}
              />
            ))}
          </div>
        </>
      )}

      {/* Scan + Detect + Full Summary */}
      <div className="card" style={{ marginTop: 48, borderLeft: "4px solid #2F81F7" }}>
        <p className="label">📄 SCAN, DETECT & FULL REPORT SUMMARY</p>
        <h3 style={{ marginTop: 8, marginBottom: 12 }}>{fullReportSummary.title}</h3>

        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: "0 0 8px 0", color: "#E8EAED", fontSize: 14, fontWeight: 600 }}>
            Detection Highlights
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#9AA0A6", lineHeight: 1.6 }}>
            {fullReportSummary.detectionItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 12, background: "#1F2A44", padding: 12, borderRadius: 6 }}>
          <p style={{ margin: 0, color: "#E8EAED", fontSize: 14 }}>
            <strong>Final Summary:</strong> {fullReportSummary.finalSummary}
          </p>
        </div>

        <div style={{ marginTop: 12, background: "#0B1220", padding: 12, borderRadius: 6, border: "1px solid #1F2A44" }}>
          <p style={{ margin: "0 0 8px 0", color: "#E8EAED", fontSize: 14, fontWeight: 600 }}>
            AI Human-Readable Explanation
          </p>

          {aiSummaryLoading && <p className="muted" style={{ margin: 0, fontSize: 13 }}>Generating AI summary…</p>}

          {!aiSummaryLoading && aiSummaryError && (
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              AI summary unavailable ({aiSummaryError}). Showing rule-based summary above.
            </p>
          )}

          {!aiSummaryLoading && !aiSummaryError && aiSummary && (
            <>
              <p style={{ margin: "0 0 8px 0", color: "#9AA0A6", fontSize: 14 }}>{aiSummary.summary}</p>

              {aiSummary.nextSteps.length > 0 && (
                <ul style={{ margin: "0 0 8px 0", paddingLeft: 18, color: "#9AA0A6", lineHeight: 1.6, fontSize: 13 }}>
                  {aiSummary.nextSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              )}

              {aiSummary.recommendation && (
                <p style={{ margin: 0, color: "#E8EAED", fontSize: 13 }}>
                  <strong>Recommendation:</strong> {aiSummary.recommendation}
                </p>
              )}
            </>
          )}
        </div>

        <div style={{ marginTop: 12, background: "#0B1220", padding: 12, borderRadius: 6, border: "1px solid #1F2A44" }}>
          <p style={{ margin: "0 0 8px 0", color: "#E8EAED", fontSize: 14, fontWeight: 600 }}>
            Ask AI about this report (Groq)
          </p>

          <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
            {chatMessages.length === 0 && (
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                Ask questions like: “What should I fix first?” or “Can this device be reused safely?”
              </p>
            )}

            {chatMessages.map((msg, index) => (
              <div
                key={index}
                style={{
                  background: msg.role === "user" ? "#1F2A44" : "#141F38",
                  border: "1px solid #1F2A44",
                  borderRadius: 6,
                  padding: 10
                }}
              >
                <p style={{ margin: "0 0 4px 0", fontSize: 11, color: "#9AA0A6", textTransform: "uppercase" }}>
                  {msg.role === "user" ? "You" : "AI"}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "#E8EAED", whiteSpace: "pre-wrap" }}>{msg.content}</p>
              </div>
            ))}
          </div>

          {chatError && (
            <p className="muted" style={{ margin: "0 0 8px 0", fontSize: 12 }}>
              Chat unavailable: {chatError}
            </p>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about this report..."
              style={{
                flex: 1,
                minWidth: 260,
                background: "#141F38",
                color: "#E8EAED",
                border: "1px solid #1F2A44",
                borderRadius: 8,
                padding: "10px 12px",
                fontFamily: "inherit",
                fontSize: 13
              }}
              onKeyDown={async (e) => {
                if (e.key !== "Enter" || chatLoading) return;
                e.preventDefault();
                await askAiQuestion();
              }}
            />

            <button
              className="btn btn-primary"
              disabled={chatLoading || !chatInput.trim()}
              onClick={askAiQuestion}
            >
              {chatLoading ? "Asking..." : "Ask AI"}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 60, textAlign: "center", paddingTop: 40, borderTop: "1px solid #1F2A44" }}>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={downloadReport}>⬇ Download Report</button>
          <button className="btn btn-secondary" onClick={refreshLockedData}>🔄 Refresh Data</button>
          <button className="btn btn-secondary" onClick={() => navigate("/")}>🏠 Back to Home</button>
          <button className="btn btn-secondary">🔄 Run Analysis Again</button>
        </div>
      </div>
    </div>
  );
}
