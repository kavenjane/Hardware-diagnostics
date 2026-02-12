export default function ReusabilityBadge({ reusable, verdict, confidence }) {
  const bgColor = reusable ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)";
  const borderColor = reusable ? "#10B981" : "#EF4444";
  const textColor = reusable ? "#34D399" : "#F87171";
  const icon = reusable ? "✅" : "❌";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 20px",
        borderRadius: 24,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        fontSize: 14,
        fontWeight: 600,
        color: textColor,
        whiteSpace: "nowrap"
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span>{verdict}</span>
      <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 400 }}>({confidence}%)</span>
    </div>
  );
}
