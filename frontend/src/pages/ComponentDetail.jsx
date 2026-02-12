import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SubMetricCard from "../components/SubMetricCard";
import ReusabilityBadge from "../components/ReusabilityBadge";
import ScoreRing from "../components/ScoreRing";
import RecommendationList from "../components/RecommendationList";
import LongevityBar from "../components/LongevityBar";

export default function ComponentDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000");

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "update" && message.data) {
          const breakdown = message.data.componentBreakdowns?.[name];
          if (breakdown) {
            setData({
              component: breakdown,
              overallHealth: message.data.overall?.health,
              overallScore: message.data.overall?.total_score
            });
            setError(null);
          }
        }
      } catch (err) {
        console.error("WebSocket parse error:", err);
      }
    };

    ws.onerror = () => {
      fetch(`http://localhost:3000/api/component/${name}`)
        .then((res) => {
          if (!res.ok) throw new Error("Component data not available");
          return res.json();
        })
        .then(setData)
        .catch((err) => setError(err.message));
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [name]);

  if (error) {
    return (
      <div className="container">
        <p className="muted">{error}</p>
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate("/results")}>
          ← Back to Results
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container">
        <p className="muted">Loading component details…</p>
      </div>
    );
  }

  const { component } = data;

  const getHealthColor = (health) => {
    if (health === "GOOD") return "#10B981";
    if (health === "FAIR") return "#F59E0B";
    if (health === "POOR") return "#EF4444";
    return "#9AA4B2";
  };

  return (
    <div className="container">
      {/* Back navigation */}
      <button
        className="btn btn-secondary"
        style={{ marginBottom: 24, fontSize: 13, padding: "8px 16px" }}
        onClick={() => navigate("/results")}
      >
        ← Back to Results
      </button>

      {/* Header */}
      <div className="component-detail-header">
        <div style={{ flex: 1 }}>
          <p className="label">{component.icon} COMPONENT HEALTH DETAIL</p>
          <h1 style={{ fontSize: 36, margin: "8px 0" }}>{component.name}</h1>
          <p className="muted" style={{ fontSize: 14 }}>{component.summary}</p>
        </div>
        <ScoreRing
          score={component.scorePercent}
          health={component.health}
          size={120}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", margin: "32px 0" }}>
        <div className="card stat-glow">
          <p className="label">RAW VALUE</p>
          <h2 style={{ fontSize: 28, marginTop: 8 }}>
            {component.rawValue}<span className="muted" style={{ fontSize: 14 }}> {component.unit}</span>
          </h2>
        </div>
        <div className="card stat-glow">
          <p className="label">SCORE</p>
          <h2 style={{ fontSize: 28, marginTop: 8, color: getHealthColor(component.health) }}>
            {component.score}<span className="muted" style={{ fontSize: 14 }}> / {component.maxScore}</span>
          </h2>
        </div>
        <div className="card stat-glow">
          <p className="label">HEALTH STATUS</p>
          <h2 style={{ fontSize: 28, marginTop: 8, color: getHealthColor(component.health) }}>
            {component.health}
          </h2>
        </div>
        <div className="card stat-glow">
          <p className="label">WEIGHT</p>
          <h2 style={{ fontSize: 28, marginTop: 8 }}>
            {component.weightPercent}%
          </h2>
          <p className="muted" style={{ fontSize: 11, marginTop: 4 }}>of overall score</p>
        </div>
      </div>

      {/* Reusability Section */}
      <div className="card" style={{ marginBottom: 32, borderLeft: `4px solid ${component.reusability.reusable ? "#10B981" : "#EF4444"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p className="label">♻️ REUSABILITY ASSESSMENT</p>
            <h3 style={{ marginTop: 8 }}>{component.reusability.verdict}</h3>
            <p className="muted" style={{ marginTop: 4, fontSize: 13 }}>
              Confidence: {component.reusability.confidence}%
            </p>
          </div>
          <ReusabilityBadge
            reusable={component.reusability.reusable}
            verdict={component.reusability.verdict}
            confidence={component.reusability.confidence}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="reusability-bar-track">
            <div
              className="reusability-bar-fill"
              style={{
                width: `${component.reusability.confidence}%`,
                background: component.reusability.reusable
                  ? "linear-gradient(90deg, #10B981, #34D399)"
                  : "linear-gradient(90deg, #EF4444, #F87171)"
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>0%</span>
            <span className="muted" style={{ fontSize: 11 }}>Confidence</span>
            <span className="muted" style={{ fontSize: 11 }}>100%</span>
          </div>
        </div>
      </div>

      {/* Sub-Metrics Breakdown */}
      <h2 style={{ marginBottom: 16 }}>📊 Detailed Sub-Metrics</h2>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 32 }}>
        {component.subMetrics.map((metric, i) => (
          <SubMetricCard key={i} metric={metric} />
        ))}
      </div>

      {/* Core Checks */}
      {component.coreChecks && component.coreChecks.length > 0 && (
        <>
          <h2 style={{ marginBottom: 16 }}>🧠 Core Diagnostics</h2>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 32 }}>
            {component.coreChecks.map((metric, i) => (
              <SubMetricCard key={`core-${i}`} metric={metric} />
            ))}
          </div>
        </>
      )}

      {/* Longevity Estimate */}
      <h2 style={{ marginBottom: 16 }}>⏳ Component Longevity</h2>
      <LongevityBar longevity={component.longevity} componentName={component.name} />

      {/* Recommendations */}
      <h2 style={{ marginTop: 32, marginBottom: 16 }}>💡 Recommendations</h2>
      <RecommendationList recommendations={component.recommendations} />

      {/* Score Contribution Visual */}
      <h2 style={{ marginTop: 32, marginBottom: 16 }}>📐 Score Contribution</h2>
      <div className="card" style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <span style={{ fontSize: 14, minWidth: 100 }}>{component.name}</span>
          <div style={{ flex: 1, background: "#0B1220", borderRadius: 8, height: 24, overflow: "hidden" }}>
            <div
              style={{
                width: `${component.scorePercent}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${getHealthColor(component.health)}88, ${getHealthColor(component.health)})`,
                borderRadius: 8,
                transition: "width 0.6s ease"
              }}
            />
          </div>
          <span style={{ fontSize: 14, minWidth: 50, textAlign: "right" }}>{component.scorePercent}%</span>
        </div>
        <p className="muted" style={{ fontSize: 12 }}>
          This component contributes {component.weightPercent}% to the overall device health score.
          Current contribution: {component.score} out of a maximum {component.maxScore} points.
        </p>
      </div>

      {/* Navigate to other components */}
      <div style={{ borderTop: "1px solid #1F2A44", paddingTop: 32, marginTop: 16 }}>
        <p className="label" style={{ marginBottom: 16 }}>VIEW OTHER COMPONENTS</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {["cpu", "ram", "storage", "battery"].filter(c => c !== name).map((comp) => (
            <button
              key={comp}
              className="btn btn-secondary"
              onClick={() => navigate(`/component/${comp}`)}
            >
              {comp.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
