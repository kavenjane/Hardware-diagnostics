export default function LongevityBar({ longevity, componentName }) {
  const getRiskColor = (risk) => {
    if (risk === "LOW") return "#10B981";
    if (risk === "MEDIUM") return "#F59E0B";
    if (risk === "HIGH") return "#EF4444";
    return "#9AA4B2";
  };

  const maxYears = 6;
  const fillPercent = Math.min(100, (longevity.estimatedYears / maxYears) * 100);

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 20 }}>
        <div>
          <p className="label">ESTIMATED LIFESPAN</p>
          <h3 style={{ marginTop: 6, fontSize: 24 }}>
            {longevity.estimatedYears} <span className="muted" style={{ fontSize: 14 }}>years</span>
          </h3>
        </div>
        <div>
          <p className="label">RISK LEVEL</p>
          <h3 style={{ marginTop: 6, fontSize: 24, color: getRiskColor(longevity.riskLevel) }}>
            {longevity.riskLevel}
          </h3>
        </div>
        <div>
          <p className="label">DEGRADATION RATE</p>
          <h3 style={{ marginTop: 6, fontSize: 16 }}>{longevity.degradationRate}</h3>
        </div>
      </div>

      {/* Visual bar */}
      <p className="muted" style={{ fontSize: 11, marginBottom: 6 }}>
        {componentName} lifespan projection (max {maxYears} years)
      </p>
      <div className="longevity-bar-track">
        <div
          className="longevity-bar-fill"
          style={{
            width: `${fillPercent}%`,
            background: `linear-gradient(90deg, ${getRiskColor(longevity.riskLevel)}88, ${getRiskColor(longevity.riskLevel)})`
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span className="muted" style={{ fontSize: 10 }}>0 yrs</span>
        <span className="muted" style={{ fontSize: 10 }}>{maxYears} yrs</span>
      </div>
    </div>
  );
}
