import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Instructions() {
  const navigate = useNavigate();
  const [detectedOS, setDetectedOS] = useState("Unknown");
  const [recommendedTrack, setRecommendedTrack] = useState("linux");

  useEffect(() => {
    const platform = navigator?.userAgentData?.platform || navigator?.platform || "";
    const ua = navigator?.userAgent || "";
    const raw = `${platform} ${ua}`;
    const isWindows = /Win/i.test(raw);
    const isMac = /Mac/i.test(raw) && !/iPhone|iPad|iPod/i.test(raw);
    const isLinux = /Linux|X11|Ubuntu|Debian|Fedora|Arch|Manjaro/i.test(raw) && !/Android/i.test(raw);

    if (isWindows) {
      setDetectedOS("Windows");
      setRecommendedTrack("windows");
      return;
    }
    if (isMac) {
      setDetectedOS("macOS");
      setRecommendedTrack("linux");
      return;
    }
    if (isLinux) {
      setDetectedOS("Linux");
      setRecommendedTrack("linux");
      return;
    }

    setDetectedOS("Unknown");
    setRecommendedTrack("linux");
  }, []);

  const recommendLabel = recommendedTrack === "windows" ? "Windows (PowerShell)" : "Linux & macOS (Bash)";
  const recommendColor = recommendedTrack === "windows" ? "#2F81F7" : "#34A853";

  return (
    <div className="container" style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "#2F81F7",
            fontSize: 14,
            cursor: "pointer",
            marginBottom: 20,
            padding: 0
          }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Setup Instructions</h1>
        <p className="muted">Follow these steps to run diagnostics on your device</p>
      </div>

      <div className="card" style={{ marginBottom: 24, borderLeft: `4px solid ${recommendColor}` }}>
        <p className="label">Detected OS: {detectedOS}</p>
        <p className="muted">Recommendation: use the {recommendLabel} steps below.</p>
      </div>

      {/* Windows Instructions */}
      <div className="card" style={{ marginBottom: 24, borderLeft: "4px solid #2F81F7" }}>
        <p className="label">
          💻 WINDOWS (PowerShell)
          {recommendedTrack === "windows" && (
            <span style={{ marginLeft: 8, color: "#0B1220", background: "#2F81F7", padding: "2px 8px", borderRadius: 999, fontSize: 12 }}>
              Recommended
            </span>
          )}
        </p>
        <div style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 12, color: "#E8EAED" }}>Step 1: Download Script</h3>
          <p className="muted">
            Click the <strong>Download Script</strong> button on the main page and save the file.
          </p>

          <h3 style={{ marginBottom: 12, marginTop: 20, color: "#E8EAED" }}>Step 2: Open PowerShell</h3>
          <p className="muted">
            Press <code style={{ background: "#0B1220", padding: "2px 6px", borderRadius: 3 }}>Win + R</code>, type <code style={{ background: "#0B1220", padding: "2px 6px", borderRadius: 3 }}>powershell</code>, and press Enter. Or search for "PowerShell" in the Start menu.
          </p>

          <h3 style={{ marginBottom: 12, marginTop: 20, color: "#E8EAED" }}>Step 3: Allow Script Execution</h3>
          <p className="muted" style={{ marginBottom: 12 }}>
            Run the following command to allow script execution (one-time setup):
          </p>
          <div
            style={{
              background: "#0B1220",
              border: "1px solid #1F2A44",
              borderRadius: 6,
              padding: 12,
              marginBottom: 12,
              overflow: "auto"
            }}
          >
            <code style={{ fontSize: 12, color: "#2F81F7", fontFamily: "'JetBrains Mono', monospace" }}>
              Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
            </code>
          </div>

          <h3 style={{ marginBottom: 12, marginTop: 20, color: "#E8EAED" }}>Step 4: Run the Script</h3>
          <p className="muted" style={{ marginBottom: 12 }}>
            Navigate to where you saved the script and run it:
          </p>
          <div
            style={{
              background: "#0B1220",
              border: "1px solid #1F2A44",
              borderRadius: 6,
              padding: 12,
              overflow: "auto"
            }}
          >
            <code style={{ fontSize: 12, color: "#2F81F7", fontFamily: "'JetBrains Mono', monospace" }}>
              .\diagnostics.ps1
            </code>
          </div>
        </div>
      </div>

      {/* Linux/Mac Instructions */}
      <div className="card" style={{ marginBottom: 24, borderLeft: "4px solid #34A853" }}>
        <p className="label">
          🐧 LINUX & macOS (Bash)
          {recommendedTrack === "linux" && (
            <span style={{ marginLeft: 8, color: "#0B1220", background: "#34A853", padding: "2px 8px", borderRadius: 999, fontSize: 12 }}>
              Recommended
            </span>
          )}
        </p>
        <div style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 12, color: "#E8EAED" }}>Step 1: Download Script</h3>
          <p className="muted">
            Click the <strong>Download Script</strong> button on the main page and save the file.
          </p>

          <h3 style={{ marginBottom: 12, marginTop: 20, color: "#E8EAED" }}>Step 2: Open Terminal</h3>
          <p className="muted">
            Open your terminal/command line application.
          </p>

          <h3 style={{ marginBottom: 12, marginTop: 20, color: "#E8EAED" }}>Step 3: Make Script Executable</h3>
          <p className="muted" style={{ marginBottom: 12 }}>
            Navigate to where you saved the script and run:
          </p>
          <div
            style={{
              background: "#0B1220",
              border: "1px solid #1F2A44",
              borderRadius: 6,
              padding: 12,
              marginBottom: 12,
              overflow: "auto"
            }}
          >
            <code style={{ fontSize: 12, color: "#34A853", fontFamily: "'JetBrains Mono', monospace" }}>
              chmod +x diagnostics.sh
            </code>
          </div>

          <h3 style={{ marginBottom: 12, marginTop: 20, color: "#E8EAED" }}>Step 4: Run the Script</h3>
          <p className="muted" style={{ marginBottom: 12 }}>
            Execute the script with:
          </p>
          <div
            style={{
              background: "#0B1220",
              border: "1px solid #1F2A44",
              borderRadius: 6,
              padding: 12,
              overflow: "auto"
            }}
          >
            <code style={{ fontSize: 12, color: "#34A853", fontFamily: "'JetBrains Mono', monospace" }}>
              ./diagnostics.sh
            </code>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="card" style={{ background: "#0B1220", borderLeft: "4px solid #FBBC04" }}>
        <p className="label">⚠️ IMPORTANT NOTES</p>
        <ul style={{ marginTop: 12, marginLeft: 20, color: "#9AA0A6" }}>
          <li style={{ marginBottom: 12 }}>
            Make sure the backend is running at <code style={{ background: "#141F38", padding: "2px 6px", borderRadius: 3 }}>http://localhost:3000</code>
          </li>
          <li style={{ marginBottom: 12 }}>
            The script will send your device diagnostics to the backend for analysis
          </li>
          <li style={{ marginBottom: 12 }}>
            This operation is read-only and does not modify your system
          </li>
          <li>
            After the script runs, the analysis page will automatically show results when processing completes
          </li>
        </ul>
      </div>

      {/* Action buttons */}
      <div style={{ marginTop: 40, textAlign: "center" }}>
        <button
          onClick={() => navigate("/")}
          className="btn btn-primary"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
