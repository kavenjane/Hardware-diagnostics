import { useEffect, useRef, useState } from "react";
import LiveMonitor from "../components/LiveMonitor";
import useLiveEvaluation from "../hooks/useLiveEvaluation";

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const lastEvaluationRef = useRef(null);
  const {
    evaluation,
    connectionStatus,
    lastUpdate,
    isConnected
  } = useLiveEvaluation();

  useEffect(() => {
    if (!evaluation) return;
    const evaluationKey = JSON.stringify({
      standardized: evaluation.standardized?.totalScore,
      legacy: evaluation.overall?.total_score,
      model: evaluation.evaluationModel
    });

    if (lastEvaluationRef.current === evaluationKey) return;

    lastEvaluationRef.current = evaluationKey;
    setHistory((prev) => [
      { timestamp: new Date(), data: evaluation },
      ...prev
    ].slice(0, 20));
  }, [evaluation]);

  const getScoreColor = (score) => {
    if (score >= 85) return "#10B981";
    if (score >= 70) return "#3B82F6";
    if (score >= 50) return "#F59E0B";
    return "#EF4444";
  };

  const hasStandardized = evaluation?.standardized !== undefined;

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p className="label">LIVE MONITORING DASHBOARD</p>
        <h1 style={{ fontSize: 32, margin: "8px 0 0 0" }}>
          Hardware Evaluation Dashboard
        </h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Real-time monitoring and analysis of hardware diagnostics
        </p>
      </div>

      {/* Live Monitor Widget */}
      <LiveMonitor
        evaluation={evaluation}
        lastUpdate={lastUpdate}
        isConnected={isConnected}
        connectionStatus={connectionStatus}
      />

      {/* Current Evaluation Display */}
      {evaluation && hasStandardized && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 24 }}>Current Evaluation</h2>

          {/* Quick Stats Grid */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 24
            }}
          >
            <div
              className="card"
              style={{
                padding: 20,
                textAlign: "center",
                borderTop: `3px solid ${getScoreColor(
                  evaluation.standardized.totalScore
                )}`
              }}
            >
              <p className="label">OVERALL SCORE</p>
              <h2
                style={{
                  fontSize: 36,
                  margin: "12px 0",
                  color: getScoreColor(evaluation.standardized.totalScore)
                }}
              >
                {evaluation.standardized.totalScore}
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: "#9AA0A6" }}>
                / 100 points
              </p>
            </div>

            <div
              className="card"
              style={{
                padding: 20,
                textAlign: "center",
                borderTop: "3px solid #10B981"
              }}
            >
              <p className="label">CLASSIFICATION</p>
              <h3 style={{ margin: "12px 0", fontSize: 16, color: "#10B981" }}>
                {evaluation.standardized.classification.level}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#9AA0A6" }}>
                {evaluation.standardized.classification.tier}
              </p>
            </div>

            <div className="card" style={{ padding: 20, textAlign: "center" }}>
              <p className="label">CATEGORY SCORES</p>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(evaluation.standardized.categories).map(
                  ([_, cat]) => (
                    <div
                      key={cat.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12
                      }}
                    >
                      <span style={{ color: "#9AA0A6" }}>
                        {cat.label.split(" ")[0]}
                      </span>
                      <span style={{ color: "#E8EAED", fontWeight: 600 }}>
                        {cat.score}/{cat.maxScore}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Category Progress Bars */}
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 16 }}>
              Category Performance
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Object.entries(evaluation.standardized.categories).map(
                ([key, cat]) => (
                  <div key={key}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                        alignItems: "center"
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        {cat.label}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#9AA0A6"
                        }}
                      >
                        {cat.percentage}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        background: "#1F2A44",
                        borderRadius: 4,
                        overflow: "hidden"
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background: getScoreColor(cat.score),
                          width: `${cat.percentage}%`,
                          transition: "width 0.6s ease"
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Recommendations */}
          {evaluation.standardized.recommendedActions &&
            evaluation.standardized.recommendedActions.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 16 }}>
                  Recommendations
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {evaluation.standardized.recommendedActions.map(
                    (action, idx) => (
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
                        <p
                          style={{
                            margin: "0 0 4px 0",
                            fontSize: 13,
                            fontWeight: 600
                          }}
                        >
                          {action.action}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: "#9AA0A6" }}>
                          {action.description}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Evaluation History */}
      {history.length > 1 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ marginBottom: 24 }}>Recent Evaluations</h2>
          <div className="card" style={{ padding: 20 }}>
            <div
              style={{
                overflowX: "auto"
              }}
            >
              <table
                style={{
                  width: "100%",
                  fontSize: 13,
                  borderCollapse: "collapse"
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #1F2A44" }}>
                    <th style={{ padding: "12px 0", textAlign: "left", color: "#9AA0A6", fontWeight: 600 }}>
                      Time
                    </th>
                    <th style={{ padding: "12px 0", textAlign: "left", color: "#9AA0A6", fontWeight: 600 }}>
                      Score
                    </th>
                    <th style={{ padding: "12px 0", textAlign: "left", color: "#9AA0A6", fontWeight: 600 }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 10).map((entry, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: idx < 9 ? "1px solid #1F2A44" : "none"
                      }}
                    >
                      <td style={{ padding: "12px 0", color: "#9AA0A6" }}>
                        {entry.timestamp.toLocaleTimeString()}
                      </td>
                      <td
                        style={{
                          padding: "12px 0",
                          color: getScoreColor(
                            entry.data.standardized?.totalScore ||
                            entry.data.overall?.total_score
                          ),
                          fontWeight: 600
                        }}
                      >
                        {entry.data.standardized?.totalScore ||
                          entry.data.overall?.total_score}
                        /100
                      </td>
                      <td style={{ padding: "12px 0", color: "#9AA0A6" }}>
                        {entry.data.standardized?.classification?.level ||
                          entry.data.overall?.health}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!evaluation && (
        <div
          className="card"
          style={{
            padding: 60,
            textAlign: "center",
            marginTop: 40
          }}
        >
          <p style={{ fontSize: 36, margin: "0 0 12px 0" }}>📊</p>
          <h3 style={{ margin: "0 0 8px 0" }}>No Data Available</h3>
          <p style={{ margin: 0, color: "#9AA0A6" }}>
            Waiting for evaluation data. Make sure the backend is running and diagnostics have been submitted.
          </p>
        </div>
      )}
    </div>
  );
}
