export default function StandardizedScoreCard({ evaluation }) {
  if (!evaluation || !evaluation.standardized) return null;

  const { standardized } = evaluation;
  const { totalScore, classification, categories, summary } = standardized;

  const getScoreColor = (score) => {
    if (score >= 85) return "#10B981"; // Green
    if (score >= 70) return "#3B82F6"; // Blue
    if (score >= 50) return "#F59E0B"; // Orange
    return "#EF4444"; // Red
  };

  const getClassificationBg = (tier) => {
    if (tier === "HIGH_GRADE") return "#10B98120";
    if (tier === "REUSABLE") return "#3B82F620";
    if (tier === "LIMITED") return "#F59E0B20";
    return "#EF444420";
  };

  const scoreColor = getScoreColor(totalScore);
  const classificationBg = getClassificationBg(classification.tier);

  return (
    <div className="standardized-score-card">
      {/* Main Score Display */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* Score Ring */}
          <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
            <svg width={140} height={140} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={70} cy={70} r={60} fill="none" stroke="#1F2A44" strokeWidth="10" />
              <circle
                cx={70}
                cy={70}
                r={60}
                fill="none"
                stroke={scoreColor}
                strokeWidth="10"
                strokeDasharray={377}
                strokeDashoffset={377 - (totalScore / 100) * 377}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <span style={{ fontSize: 42, fontWeight: 700, color: scoreColor }}>{totalScore}</span>
              <span style={{ fontSize: 12, color: "#9AA0A6" }}>/ 100</span>
            </div>
          </div>

          {/* Summary */}
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 12px 0", fontSize: 24, color: "#E8EAED" }}>
              {classification.level}
            </h2>
            <p style={{ margin: 0, color: "#9AA0A6", fontSize: 14, lineHeight: 1.5 }}>
              {classification.description}
            </p>
            <div
              style={{
                marginTop: 16,
                padding: "12px 16px",
                background: classificationBg,
                borderRadius: 8,
                border: `1px solid ${scoreColor}40`
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: scoreColor, fontWeight: 600 }}>
                {summary.split(" | ")[0]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#E8EAED", fontWeight: 600 }}>
          Evaluation Breakdown
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {Object.entries(categories).map(([key, category]) => (
            <div
              key={key}
              style={{
                padding: 16,
                background: "#1F2A44",
                borderRadius: 8,
                borderLeft: `3px solid ${scoreColor}`
              }}
            >
              <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#9AA0A6", fontWeight: 600 }}>
                {category.label}
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: scoreColor }}>
                  {category.score}
                </span>
                <span style={{ fontSize: 14, color: "#9AA0A6" }}>
                  / {category.maxScore}
                </span>
              </div>
              <div
                style={{
                  marginTop: 8,
                  height: 4,
                  background: "#0B1220",
                  borderRadius: 2,
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: scoreColor,
                    width: `${category.percentage}%`,
                    transition: "width 0.6s ease"
                  }}
                />
              </div>
              <p style={{ margin: "6px 0 0 0", fontSize: 11, color: "#9AA0A6" }}>
                {category.percentage}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {standardized.recommendedActions && standardized.recommendedActions.length > 0 && (
        <div>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 16, color: "#E8EAED", fontWeight: 600 }}>
            Recommendations
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {standardized.recommendedActions.map((action, idx) => (
              <div
                key={idx}
                style={{
                  padding: 12,
                  background: "#1F2A44",
                  borderRadius: 6,
                  borderLeft: `3px solid ${
                    action.priority === "CRITICAL"
                      ? "#EF4444"
                      : action.priority === "HIGH"
                      ? "#F59E0B"
                      : "#10B981"
                  }`
                }}
              >
                <p style={{ margin: "0 0 4px 0", fontSize: 13, fontWeight: 600, color: "#E8EAED" }}>
                  {action.action}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "#9AA0A6" }}>
                  {action.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
