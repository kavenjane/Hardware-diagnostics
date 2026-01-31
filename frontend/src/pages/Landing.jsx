import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  const downloadScript = (type) => {
    const scripts = {
      bash: {
        name: "diagnostics.sh",
        url: "/scripts/diagnostics.sh"
      },
      ps1: {
        name: "diagnostics.ps1",
        url: "/scripts/diagnostics.ps1"
      }
    };

    const script = scripts[type];
    const link = document.createElement("a");
    link.href = script.url;
    link.download = script.name;
    link.click();
  };

  return (
    <div className="landing-container">
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <span className="label">OPEN SOURCE · PRIVACY FIRST</span>

          <h1 className="hero-title">
            Hardware Diagnostics &<br />Device Health Check
          </h1>

          <p className="subtitle">
            Run a lightweight local script to analyze your system components
            without leaving your browser.
          </p>
        </div>

        {/* Download buttons */}
        <div className="download-section">
          <div
            className="card"
            style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}
          >
            <div style={{ display: "flex", gap: 12, width: "100%", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                onClick={() => downloadScript("ps1")}
              >
                <span style={{ marginRight: 8 }}>⬇</span> Download for Windows (PowerShell)
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => downloadScript("bash")}
              >
                <span style={{ marginRight: 8 }}>⬇</span> Download for Linux (Bash)
              </button>
            </div>
            <p className="small-text">Save the script and run it in your terminal</p>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ marginTop: 60 }}>
          <div className="card" style={{ borderLeft: "4px solid #2F81F7", background: "#0B1220" }}>
            <h3 style={{ marginBottom: 16, color: "#2F81F7" }}>📋 How to Use</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
              <div>
                <h4 style={{ color: "#E8EAED", marginBottom: 12 }}>Windows (PowerShell)</h4>
                <ol style={{ paddingLeft: 20, color: "#9AA0A6", lineHeight: 1.6 }}>
                  <li>Download the PowerShell script above</li>
                  <li>Right-click the downloaded file</li>
                  <li>Select "Run with PowerShell"</li>
                  <li>Or open PowerShell and run: <code style={{ background: "#1F2A44", padding: "2px 6px", borderRadius: 3 }}>.\diagnostics.ps1</code></li>
                </ol>
              </div>

              <div>
                <h4 style={{ color: "#E8EAED", marginBottom: 12 }}>Linux/Mac (Bash)</h4>
                <ol style={{ paddingLeft: 20, color: "#9AA0A6", lineHeight: 1.6 }}>
                  <li>Download the Bash script above</li>
                  <li>Open Terminal</li>
                  <li>Navigate to download folder: <code style={{ background: "#1F2A44", padding: "2px 6px", borderRadius: 3 }}>cd Downloads</code></li>
                  <li>Make executable: <code style={{ background: "#1F2A44", padding: "2px 6px", borderRadius: 3 }}>chmod +x diagnostics.sh</code></li>
                  <li>Run the script: <code style={{ background: "#1F2A44", padding: "2px 6px", borderRadius: 3 }}>./diagnostics.sh</code></li>
                </ol>
              </div>
            </div>

            <div style={{ background: "#1F2A44", padding: 16, borderRadius: 6, marginTop: 16 }}>
              <p style={{ margin: 0, color: "#9AA0A6", fontSize: 14 }}>
                <strong>⚠️ Security Note:</strong> These scripts are read-only and collect only basic system metrics.
                They send data to your local backend server only. No external connections are made.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div style={{ marginTop: 80 }}>
          <h2 style={{ textAlign: "center", marginBottom: 40 }}>Secure. Transparent. Lightweight.</h2>
          <p className="subtitle" style={{ textAlign: "center", marginBottom: 40 }}>
            Our diagnostic tool analyzes your hardware without installation or system impact.
          </p>

          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            }}
          >
            <div className="card feature-card">
              <div className="feature-icon">🔒</div>
              <strong>Read-Only</strong>
              <p className="muted">No system modifications or installs.</p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon">⚡</div>
              <strong>Zero-Install</strong>
              <p className="muted">Runs directly in terminal.</p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon">🛡️</div>
              <strong>Privacy-First</strong>
              <p className="muted">No data leaves your control.</p>
            </div>
          </div>
        </div>

        {/* Continue */}
        <div style={{ marginTop: 100, textAlign: "center" }}>
          <h2>Ready to proceed?</h2>
          <p className="subtitle" style={{ marginBottom: 24 }}>Once you have run the diagnostic script, click below to analyze the results</p>

          <button className="btn btn-primary btn-large" onClick={() => navigate("/analysis")}>
            I have run the script → Continue
          </button>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 100, textAlign: "center", paddingTop: 40, borderTop: "1px solid #1F2A44" }}>
          <p className="muted" style={{ fontSize: 13 }}>© 2024-2026. Open source · MIT License</p>
        </div>
      </div>
    </div>
  );
}
