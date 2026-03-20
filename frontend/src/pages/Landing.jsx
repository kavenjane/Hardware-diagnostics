import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  const downloadScript = (type) => {
    const scripts = {
      bash: {
        name: "diagnostics.sh",
        url: "/diagnostics.sh"
      },
      ps1: {
        name: "diagnostics.ps1",
        url: "/diagnostics.ps1"
      },
      launcher_bat: {
        name: "run_diagnostics.bat",
        url: "/run_diagnostics.bat"
      },
      launcher_sh: {
        name: "run_diagnostics.sh",
        url: "/run_diagnostics.sh"
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
                onClick={() => downloadScript("launcher_bat")}
                style={{ background: "#2F81F7", borderColor: "#2F81F7" }}
              >
                <span style={{ marginRight: 8 }}>🚀</span> Auto-Run for Windows
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => downloadScript("launcher_sh")}
                style={{ background: "#34A853", borderColor: "#34A853" }}
              >
                <span style={{ marginRight: 8 }}>🚀</span> Auto-Run for Linux/Mac
              </button>
            </div>
            <p className="small-text" style={{ color: "#2F81F7", fontWeight: "bold" }}>
              ⚡ One-click download and run - no manual setup required!
            </p>

            <div style={{ marginTop: 16, padding: 12, background: "#1F2A44", borderRadius: 6, width: "100%" }}>
              <p style={{ margin: 0, fontSize: 14, color: "#9AA0A6", textAlign: "center" }}>
                <strong>Alternative:</strong> Download individual scripts below for manual execution
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
                <button
                  className="btn btn-outline"
                  onClick={() => downloadScript("ps1")}
                  style={{ fontSize: 12, padding: "6px 12px" }}
                >
                  PowerShell Script
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => downloadScript("bash")}
                  style={{ fontSize: 12, padding: "6px 12px" }}
                >
                  Bash Script
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ marginTop: 60 }}>
          <div className="card" style={{ borderLeft: "4px solid #2F81F7", background: "#0B1220" }}>
            <h3 style={{ marginBottom: 16, color: "#2F81F7" }}>� Quick Start (Automated)</h3>

            <div style={{ marginBottom: 20 }}>
              <p style={{ color: "#E8EAED", marginBottom: 12 }}>
                <strong>Simplest Option:</strong> Download and run the automated launcher for your platform above.
                It handles everything automatically!
              </p>
            </div>

            <h3 style={{ marginBottom: 16, color: "#2F81F7", marginTop: 24 }}>📋 Manual Setup (Alternative)</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
              <div>
                <h4 style={{ color: "#E8EAED", marginBottom: 12 }}>Windows (PowerShell)</h4>
                <ol style={{ paddingLeft: 20, color: "#9AA0A6", lineHeight: 1.6 }}>
                  <li>Download the PowerShell script</li>
                  <li>Right-click the downloaded file</li>
                  <li>Select "Run with PowerShell"</li>
                  <li>Or open PowerShell and run: <code style={{ background: "#1F2A44", padding: "2px 6px", borderRadius: 3 }}>.\diagnostics.ps1</code></li>
                </ol>
              </div>

              <div>
                <h4 style={{ color: "#E8EAED", marginBottom: 12 }}>Linux/Mac (Bash)</h4>
                <ol style={{ paddingLeft: 20, color: "#9AA0A6", lineHeight: 1.6 }}>
                  <li>Download the Bash script</li>
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

        {/* Mobile PWA */}
        <div style={{ marginTop: 80 }}>
          <h2 style={{ textAlign: "center", marginBottom: 16 }}>Mobile PWA</h2>
          <p className="subtitle" style={{ textAlign: "center", marginBottom: 24 }}>
            Use this app like a mobile app by installing it to your home screen for faster access.
          </p>

          <div className="card" style={{ maxWidth: 900, margin: "0 auto", borderLeft: "4px solid #34A853" }}>
            <p style={{ marginTop: 0, color: "#E8EAED" }}>
              <strong>How to install on mobile:</strong>
            </p>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              <div>
                <h4 style={{ marginTop: 0, marginBottom: 8, color: "#E8EAED" }}>Android (Chrome)</h4>
                <ol style={{ margin: 0, paddingLeft: 18, color: "#9AA0A6", lineHeight: 1.6 }}>
                  <li>Open the app URL in Chrome</li>
                  <li>Tap the browser menu (⋮)</li>
                  <li>Select "Add to Home screen"</li>
                  <li>Confirm to install the app icon</li>
                </ol>
              </div>

              <div>
                <h4 style={{ marginTop: 0, marginBottom: 8, color: "#E8EAED" }}>iPhone (Safari)</h4>
                <ol style={{ margin: 0, paddingLeft: 18, color: "#9AA0A6", lineHeight: 1.6 }}>
                  <li>Open the app URL in Safari</li>
                  <li>Tap the Share button</li>
                  <li>Select "Add to Home Screen"</li>
                  <li>Tap "Add" to install the app icon</li>
                </ol>
              </div>
            </div>

            <div style={{ marginTop: 16, background: "#1F2A44", padding: 12, borderRadius: 6 }}>
              <p style={{ margin: 0, color: "#9AA0A6", fontSize: 14 }}>
                <strong>Note:</strong> Full offline support depends on enabling service worker and web manifest configuration.
              </p>
            </div>

            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button className="btn btn-primary" onClick={() => navigate("/scan")}>
                📷 Open PWA Scanning
              </button>
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
