export default function ScoreRing({ score, health, size = 100 }) {
  const getHealthColor = (h) => {
    if (h === "GOOD") return "#10B981";
    if (h === "FAIR") return "#F59E0B";
    if (h === "POOR") return "#EF4444";
    return "#9AA4B2";
  };

  const color = getHealthColor(health);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1F2A44"
          strokeWidth="8"
        />
        {/* Score ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
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
        <span style={{ fontSize: size * 0.25, fontWeight: 700, color }}>{score}%</span>
        <span style={{ fontSize: size * 0.1, color: "#9AA4B2", marginTop: 2 }}>{health}</span>
      </div>
    </div>
  );
}
