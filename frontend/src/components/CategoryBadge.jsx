export default function CategoryBadge({ category, score, maxScore, details }) {
  const percentage = Math.round((score / maxScore) * 100);

  const getColor = () => {
    if (percentage >= 90) return "#10B981";
    if (percentage >= 75) return "#3B82F6";
    if (percentage >= 50) return "#F59E0B";
    return "#EF4444";
  };

  const color = getColor();

  return (
    <div
      style={{
        padding: 20,
        background: "#1F2A44",
        borderRadius: 12,
        borderLeft: `4px solid ${color}`,
        marginBottom: 16
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: "#E8EAED", fontWeight: 600 }}>
          {category}
        </h3>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
          <span style={{ fontSize: 24, fontWeight: 700, color }}>
            {score}
          </span>
          <span style={{ fontSize: 13, color: "#9AA0A6" }}>
            / {maxScore}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          height: 8,
          background: "#0B1220",
          borderRadius: 4,
          overflow: "hidden",
          marginBottom: 12
        }}
      >
        <div
          style={{
            height: "100%",
            background: color,
            width: `${percentage}%`,
            transition: "width 0.6s ease"
          }}
        />
      </div>

      {/* Percentage */}
      <p style={{ margin: "0 0 12px 0", fontSize: 12, color: "#9AA0A6", fontWeight: 600 }}>
        {percentage}% Complete
      </p>

      {/* Details */}
      {details && Object.keys(details).length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {Object.entries(details).map(([key, value]) => {
            if (typeof value === "object" && value !== null) {
              return (
                <div key={key} style={{ fontSize: 12, color: "#9AA0A6" }}>
                  <p style={{ margin: "0 0 4px 0", fontWeight: 600 }}>
                    {typeof key === "string" ? key.replace(/_/g, " ").toUpperCase() : key}
                  </p>
                  <p style={{ margin: 0 }}>
                    {Object.entries(value)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" | ")}
                  </p>
                </div>
              );
            }
            return (
              <div key={key} style={{ fontSize: 12, color: "#9AA0A6" }}>
                <p style={{ margin: "0 0 4px 0", fontWeight: 600 }}>
                  {key.replace(/_/g, " ").toUpperCase()}
                </p>
                <p style={{ margin: 0 }}>
                  {String(value)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
