export default function LiveMonitor({
  evaluation,
  lastUpdate,
  isConnected,
  connectionStatus = "connecting"
}) {

  const getStatusColor = () => {
    if (connectionStatus === "connected") return "#10B981";
    if (connectionStatus === "error") return "#EF4444";
    return "#F59E0B";
  };

  const getStatusText = () => {
    if (connectionStatus === "connected") return "Live Updates Active";
    if (connectionStatus === "error") return "Connection Error";
    return "Connecting...";
  };

  return (
    <div style={{ padding: "20px", background: "#0B1220", borderRadius: 12, marginBottom: 32 }}>
      {/* Status Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          padding: "12px 16px",
          background: "#1F2A44",
          borderRadius: 8,
          border: `1px solid ${getStatusColor()}30`
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: getStatusColor(),
              animation: isConnected ? "pulse 2s infinite" : "none"
            }}
          />
          <span style={{ fontSize: 12, color: "#9AA0A6", fontWeight: 600 }}>
            {getStatusText()}
          </span>
        </div>
        {lastUpdate && (
          <span style={{ fontSize: 11, color: "#9AA0A6" }}>
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Live Data Display */}
      {evaluation && evaluation.standardized ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Current Score */}
            <div style={{ padding: 12, background: "#1F2A44", borderRadius: 8 }}>
              <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#9AA0A6", fontWeight: 600 }}>
                CURRENT SCORE
              </p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#2F81F7" }}>
                {evaluation.standardized.totalScore}
              </p>
            </div>

            {/* Classification */}
            <div style={{ padding: 12, background: "#1F2A44", borderRadius: 8 }}>
              <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#9AA0A6", fontWeight: 600 }}>
                STATUS
              </p>
              <p style={{ margin: 0, fontSize: 14, color: "#10B981", fontWeight: 600 }}>
                {evaluation.standardized.classification.level}
              </p>
            </div>
          </div>

          {/* Quick Category View */}
          <div style={{ marginTop: 12 }}>
            <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#9AA0A6", fontWeight: 600 }}>
              CATEGORY STATUS
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {Object.entries(evaluation.standardized.categories).map(([key, cat]) => (
                <div
                  key={key}
                  style={{
                    padding: 8,
                    background: "#1F2A44",
                    borderRadius: 6,
                    textAlign: "center",
                    borderTop: `2px solid #2F81F7`
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: 10,
                      color: "#9AA0A6",
                      fontWeight: 600
                    }}
                  >
                    {cat.label.split(" ")[0]}
                  </p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#2F81F7" }}>
                    {cat.score}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "32px 20px" }}>
          <p style={{ margin: 0, color: "#9AA0A6", fontSize: 13 }}>
            Waiting for evaluation data...
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
