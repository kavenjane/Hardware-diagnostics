import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LiveMonitor from "../components/LiveMonitor";

export default function Analysis() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    // Poll for completion status
    const interval = setInterval(() => {
      fetch("http://localhost:3000/api/status")
        .then((res) => res.json())
        .then((data) => {
          if (!data.processing && data.hasResult) {
            setStatus("complete");
            setTimeout(() => navigate("/results"), 500);
          }
          // Update progress if available
          if (data.progress) {
            setProgress(data.progress);
          }
        })
        .catch(() => {
          // Silent fail — backend may not be ready yet
        });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="container">
      <div
        style={{
          maxWidth: 720,
          margin: "60px auto",
          textAlign: "center",
        }}
      >
        {/* Live Monitor */}
        <LiveMonitor />

        {/* Spinner and Status */}
        <div
          style={{
            width: 88,
            height: 88,
            border: "4px solid #1F2A44",
            borderTopColor: "#2F81F7",
            borderRadius: "50%",
            margin: "0 auto 40px",
            animation: "spin 1.2s linear infinite",
          }}
        />

        {/* Heading */}
        <h1 style={{ marginBottom: 16, fontSize: 32 }}>
          {status === "processing" ? "Analyzing Your Device" : "Complete!"}
        </h1>

        {/* Description */}
        <p className="subtitle" style={{ marginBottom: 40 }}>
          {status === "processing"
            ? "We are processing the diagnostic data generated on your device. This operation is read-only and does not impact system performance."
            : "Your diagnostic evaluation is ready. Redirecting to results..."}
        </p>

        {/* Status card */}
        <div className="card" style={{ background: "#0B1220", borderColor: "#1F2A44" }}>
          <p className="label">
            {status === "processing" ? "ANALYZING" : "COMPLETE"}
          </p>
          <p className="muted" style={{ marginTop: 8 }}>
            {status === "processing"
              ? "Processing diagnostic data…"
              : "Generating evaluation report…"}
          </p>
          {progress > 0 && (
            <div
              style={{
                marginTop: 16,
                height: 6,
                background: "#1F2A44",
                borderRadius: 3,
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "#2F81F7",
                  width: `${progress}%`,
                  transition: "width 0.3s ease"
                }}
              />
            </div>
          )}
        </div>

        {/* Links */}
        <div style={{ marginTop: 40, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/" className="link" style={{ color: "#2F81F7", textDecoration: "none" }}>
            🏠 Home
          </a>
          <span className="muted">·</span>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/instructions"); }} className="link" style={{ color: "#2F81F7", textDecoration: "none" }}>
            📖 View Instructions
          </a>
        </div>

        {/* Footer note */}
        <p
          className="muted"
          style={{ marginTop: 40, fontSize: 13 }}
        >
          {status === "processing"
            ? "You can keep this page open. Once processing completes, you will be redirected automatically."
            : "Redirecting to results page..."}
        </p>
      </div>

      {/* Spinner animation */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
