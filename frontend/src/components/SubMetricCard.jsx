export default function SubMetricCard({ metric }) {
  const getStatusColor = (status) => {
    if (status === "GOOD") return "#10B981";
    if (status === "FAIR") return "#F59E0B";
    if (status === "POOR") return "#EF4444";
    return "#9AA4B2";
  };

  return (
    <div className="card sub-metric-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p className="label" style={{ margin: 0, fontSize: 11 }}>{metric.label}</p>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: getStatusColor(metric.status),
            boxShadow: `0 0 6px ${getStatusColor(metric.status)}66`
          }}
        />
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, margin: "4px 0", color: "#E6EDF3" }}>
        {metric.value}
      </p>
      <p style={{ fontSize: 11, color: getStatusColor(metric.status), margin: 0, fontWeight: 500 }}>
        {metric.status}
      </p>
    </div>
  );
}
