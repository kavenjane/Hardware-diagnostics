const {
  evaluateDevice: scoreDevice,
  evaluateDeviceStandardized
} = require("../rules/healthRules");

/**
 * Detect input format efficiently with early exit
 */
function isStandardizedInput(input) {
  const standardizedKeys = [
    'storage_smart_status', 'ram_test_errors', 'cpu_stress_stable',
    'gpu_stress_stable', 'performance_percentage', 'ssd_wear_percentage',
    'battery_health_percent', 'physical_damage', 'idle_temperature_celsius'
  ];
  return standardizedKeys.some(key => input.hasOwnProperty(key));
}

/**
 * Main evaluation dispatcher - auto-selects model based on input type
 */
module.exports = function evaluateDevice(input = {}) {
  try {
    // Detect input format and evaluate accordingly
    if (isStandardizedInput(input)) {
      const result = evaluateDeviceStandardized(input);
      return {
        evaluationModel: "STANDARDIZED_HARDWARE_REUSABILITY",
        standardized: result,
        overall: {
          health: result.totalScore >= 80 ? "GOOD" : result.totalScore >= 55 ? "FAIR" : "POOR",
          total_score: result.totalScore,
          reusable: result.totalScore >= 50,
          classification: result.classification.level
        }
      };
    }

    // Legacy model for simple metrics
    const report = scoreDevice({
      cpu: Number(input.cpu_usage ?? input.cpu ?? 0),
      ram: Number(input.ram_gb ?? input.ram ?? 0),
      storage: Number(input.storage_health ?? input.storage ?? 0),
      battery: Number(input.battery_health ?? input.battery ?? 0)
    });

    return {
      evaluationModel: "LEGACY_COMPONENT_HEALTH",
      components: report.components,
      componentBreakdowns: report.componentBreakdowns,
      reusabilitySummary: report.reusabilitySummary,
      overall: {
        health: report.health,
        total_score: report.totalScore,
        longevity_years: report.longevity?.yearsRemaining ?? 0,
        sustainability: report.longevity?.sustainability ?? "UNKNOWN",
        reusable: report.longevity?.reusable ?? false
      }
    };
  } catch (error) {
    console.error("Evaluation error:", error.message);
    return {
      error: error.message,
      evaluationModel: "ERROR",
      overall: { health: "UNKNOWN", total_score: 0, reusable: false }
    };
  }
};
