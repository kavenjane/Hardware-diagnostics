/**
 * Device Health Scoring Engine
 * ----------------------------
 * - Continuous (non set-wise) scoring
 * - Per-component health (GOOD / FAIR / POOR)
 * - Overall health derived from total score
 * - Easy to tune via weights, caps, and curves
 */

// ---------- Configuration ----------

// Weights define how important each component is
const WEIGHTS = {
  cpu: 0.30,
  ram: 0.25,
  storage: 0.25,
  battery: 0.20
};

// Maximum contribution per component (total = 100)
const MAX_SCORES = {
  cpu: 30,
  ram: 25,
  storage: 25,
  battery: 20
};

// Health thresholds (ratios, not raw values)
const COMPONENT_THRESHOLDS = {
  good: 0.8,
  fair: 0.5
};

const OVERALL_THRESHOLDS = {
  good: 80,
  fair: 55
};

// ---------- Utilities ----------

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ---------- Scoring Functions ----------

// CPU: linear percentage scaling
function scoreCPU(cpuPercent) {
  return clamp(
    (cpuPercent / 100) * MAX_SCORES.cpu,
    0,
    MAX_SCORES.cpu
  );
}

// RAM: diminishing returns, capped at 32GB
function scoreRAM(ramGB) {
  const effectiveRam = Math.min(ramGB, 32);
  return clamp(
    (effectiveRam / 32) * MAX_SCORES.ram,
    0,
    MAX_SCORES.ram
  );
}

// Storage: linear percentage scaling
function scoreStorage(storagePercent) {
  return clamp(
    (storagePercent / 100) * MAX_SCORES.storage,
    0,
    MAX_SCORES.storage
  );
}

// Battery: non-linear penalty (low health hurts more)
function scoreBattery(batteryPercent) {
  const normalized = clamp(batteryPercent / 100, 0, 1);
  const curved = Math.pow(normalized, 1.8);
  return curved * MAX_SCORES.battery;
}

// ---------- Health Derivation ----------

function getComponentHealth(score, maxScore) {
  const ratio = score / maxScore;

  if (ratio >= COMPONENT_THRESHOLDS.good) return "GOOD";
  if (ratio >= COMPONENT_THRESHOLDS.fair) return "FAIR";
  return "POOR";
}

function getOverallHealth(totalScore) {
  if (totalScore >= OVERALL_THRESHOLDS.good) return "GOOD";
  if (totalScore >= OVERALL_THRESHOLDS.fair) return "FAIR";
  return "POOR";
}

// ---------- Main API ----------

function evaluateDevice({ cpu, ram, storage, battery }) {
  const rawScores = {
    cpu: scoreCPU(cpu),
    ram: scoreRAM(ram),
    storage: scoreStorage(storage),
    battery: scoreBattery(battery)
  };

  const components = {
    cpu: {
      score: Number(rawScores.cpu.toFixed(2)),
      health: getComponentHealth(rawScores.cpu, MAX_SCORES.cpu)
    },
    ram: {
      score: Number(rawScores.ram.toFixed(2)),
      health: getComponentHealth(rawScores.ram, MAX_SCORES.ram)
    },
    storage: {
      score: Number(rawScores.storage.toFixed(2)),
      health: getComponentHealth(rawScores.storage, MAX_SCORES.storage)
    },
    battery: {
      score: Number(rawScores.battery.toFixed(2)),
      health: getComponentHealth(rawScores.battery, MAX_SCORES.battery)
    }
  };

  const totalScore =
    (rawScores.cpu / MAX_SCORES.cpu) * WEIGHTS.cpu * 100 +
    (rawScores.ram / MAX_SCORES.ram) * WEIGHTS.ram * 100 +
    (rawScores.storage / MAX_SCORES.storage) * WEIGHTS.storage * 100 +
    (rawScores.battery / MAX_SCORES.battery) * WEIGHTS.battery * 100;

  return {
    totalScore: Math.round(totalScore),
    health: getOverallHealth(totalScore),
    components
  };
}

// ---------- Exports ----------

module.exports = {
  evaluateDevice,
  // exposed for testing / tuning
  scoreCPU,
  scoreRAM,
  scoreStorage,
  scoreBattery
};
