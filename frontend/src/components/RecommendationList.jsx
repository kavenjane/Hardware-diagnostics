export default function RecommendationList({ recommendations }) {
  const getPriorityColor = (priority) => {
    if (priority === "HIGH") return "#EF4444";
    if (priority === "MEDIUM") return "#F59E0B";
    return "#9AA4B2";
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "UPGRADE": return "⬆️";
      case "ACTION": return "⚡";
      case "DIAGNOSTIC": return "🔍";
      case "MONITOR": return "📡";
      case "MAINTENANCE": return "🔧";
      case "INFO": return "ℹ️";
      default: return "📋";
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return <p className="muted">No recommendations at this time.</p>;
  }

  return (
    <div className="recommendation-list">
      {recommendations.map((rec, i) => (
        <div key={i} className="card recommendation-card" style={{ borderLeft: `3px solid ${getPriorityColor(rec.priority)}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{getTypeIcon(rec.type)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: getPriorityColor(rec.priority),
                    textTransform: "uppercase"
                  }}
                >
                  {rec.priority} PRIORITY
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "#1F2A44",
                    color: "#9AA4B2"
                  }}
                >
                  {rec.type}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{rec.text}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
