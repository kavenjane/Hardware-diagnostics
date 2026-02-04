const { evaluateDevice: scoreDevice } = require("../rules/healthRules");

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

module.exports = function evaluateDevice(input) {
  const report = scoreDevice({
    cpu: toNumber(input.cpu_usage ?? input.cpu),
    ram: toNumber(input.ram_gb ?? input.ram),
    storage: toNumber(input.storage_health ?? input.storage),
    battery: toNumber(input.battery_health ?? input.battery)
  });

  return {
    components: report.components,
    overall: {
      health: report.health,
      total_score: report.totalScore
    }
  };
};
