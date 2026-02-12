/**
 * Device Health Scoring Engine
 * ----------------------------
 * - Continuous (non set-wise) scoring
 * - Per-component health (GOOD / FAIR / POOR)
 * - Per-component reusability & detailed breakdown
 * - Overall health derived from total score
 * - Easy to tune via weights, caps, and curves
 */

// ---------- Configuration ----------

const WEIGHTS = {
  cpu: 0.30,
  ram: 0.25,
  storage: 0.25,
  battery: 0.20
};

const MAX_SCORES = {
  cpu: 30,
  ram: 25,
  storage: 25,
  battery: 20
};

const COMPONENT_THRESHOLDS = {
  good: 0.8,
  fair: 0.5
};

const OVERALL_THRESHOLDS = {
  good: 80,
  fair: 55
};

// Reusability thresholds per component (raw input values)
const REUSABILITY = {
  cpu: { reusableMin: 40, idealMin: 70 },
  ram: { reusableMin: 4, idealMin: 8 },
  storage: { reusableMin: 40, idealMin: 70 },
  battery: { reusableMin: 50, idealMin: 75 }
};

// ---------- Utilities ----------

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pct(value, max) {
  return Math.round((value / max) * 100);
}

// ---------- Scoring Functions ----------

function scoreCPU(cpuPercent) {
  return clamp((cpuPercent / 100) * MAX_SCORES.cpu, 0, MAX_SCORES.cpu);
}

function scoreRAM(ramGB) {
  const effectiveRam = Math.min(ramGB, 32);
  return clamp((effectiveRam / 32) * MAX_SCORES.ram, 0, MAX_SCORES.ram);
}

function scoreStorage(storagePercent) {
  return clamp((storagePercent / 100) * MAX_SCORES.storage, 0, MAX_SCORES.storage);
}

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

function estimateLongevityYears(totalScore, components) {
  const baseYears = (clamp(totalScore, 0, 100) / 100) * 6;
  const batteryHealth = components?.battery?.health;
  const batteryPenalty = batteryHealth === "POOR" ? 0.6 : batteryHealth === "FAIR" ? 0.85 : 1;
  const cpuPenalty = components?.cpu?.health === "POOR" ? 0.7 : 1;
  const storagePenalty = components?.storage?.health === "POOR" ? 0.8 : 1;
  const ramPenalty = components?.ram?.health === "POOR" ? 0.85 : 1;
  const adjusted = baseYears * batteryPenalty * cpuPenalty * storagePenalty * ramPenalty;
  return Math.max(0, Math.round(adjusted * 10) / 10);
}

function estimateSustainability(totalScore) {
  if (totalScore >= 80) return "HIGH";
  if (totalScore >= 55) return "MEDIUM";
  return "LOW";
}

function isReusable(components, totalScore) {
  if (totalScore < 60) return false;
  return !Object.values(components).some((c) => c.health === "POOR");
}

// ---------- Per-Component Reusability ----------

function isComponentReusable(component, rawValue) {
  const thresholds = REUSABILITY[component];
  if (!thresholds) return { reusable: false, confidence: 0, verdict: "UNKNOWN" };

  if (rawValue >= thresholds.idealMin) {
    return { reusable: true, confidence: 95, verdict: "FULLY REUSABLE" };
  }
  if (rawValue >= thresholds.reusableMin) {
    return { reusable: true, confidence: 65, verdict: "CONDITIONALLY REUSABLE" };
  }
  return { reusable: false, confidence: 90, verdict: "NOT REUSABLE" };
}

// ---------- Per-Component Detailed Breakdown ----------

function buildCpuBreakdown(cpuPercent, score, health) {
  const ratio = score / MAX_SCORES.cpu;
  const reusability = isComponentReusable("cpu", cpuPercent);

  // Sub-metrics breakdown
  const performanceTier = cpuPercent >= 80 ? "High Performance" : cpuPercent >= 50 ? "Mid-Range" : "Entry-Level";
  const multitaskingCapability = cpuPercent >= 70 ? "Strong" : cpuPercent >= 40 ? "Moderate" : "Limited";
  const thermalEstimate = cpuPercent >= 90 ? "High Load — may throttle" : cpuPercent >= 60 ? "Moderate — normal range" : "Low Load — cool running";

  return {
    name: "CPU",
    icon: "🔧",
    rawValue: cpuPercent,
    unit: "%",
    score,
    maxScore: MAX_SCORES.cpu,
    scorePercent: pct(score, MAX_SCORES.cpu),
    health,
    weight: WEIGHTS.cpu,
    weightPercent: WEIGHTS.cpu * 100,
    reusability,
    subMetrics: [
      { label: "Performance Tier", value: performanceTier, status: cpuPercent >= 50 ? "GOOD" : "FAIR" },
      { label: "Processing Power", value: `${cpuPercent}%`, status: health },
      { label: "Multitasking", value: multitaskingCapability, status: cpuPercent >= 40 ? "GOOD" : "POOR" },
      { label: "Thermal Estimate", value: thermalEstimate, status: cpuPercent < 90 ? "GOOD" : "FAIR" },
      { label: "Contribution Weight", value: `${WEIGHTS.cpu * 100}%`, status: "GOOD" }
    ],
    recommendations: getCpuRecommendations(cpuPercent, health),
    longevity: {
      estimatedYears: health === "GOOD" ? 4.5 : health === "FAIR" ? 2.5 : 1,
      riskLevel: health === "POOR" ? "HIGH" : health === "FAIR" ? "MEDIUM" : "LOW",
      degradationRate: health === "GOOD" ? "Slow" : health === "FAIR" ? "Moderate" : "Rapid"
    },
    summary: `CPU is operating at ${cpuPercent}% capacity, scoring ${score}/${MAX_SCORES.cpu}. ${reusability.verdict}.`
  };
}

function getCpuRecommendations(cpuPercent, health) {
  const recs = [];
  if (health === "POOR") {
    recs.push({ priority: "HIGH", text: "CPU performance is critically low. Consider upgrading the processor.", type: "UPGRADE" });
    recs.push({ priority: "HIGH", text: "Close unnecessary background processes to free up CPU resources.", type: "ACTION" });
    recs.push({ priority: "MEDIUM", text: "Check for malware or bloatware consuming CPU cycles.", type: "DIAGNOSTIC" });
  } else if (health === "FAIR") {
    recs.push({ priority: "MEDIUM", text: "CPU is functional but aging. Monitor for performance degradation.", type: "MONITOR" });
    recs.push({ priority: "LOW", text: "Consider limiting heavy multitasking to extend component life.", type: "ACTION" });
  } else {
    recs.push({ priority: "LOW", text: "CPU is performing well. No immediate action required.", type: "INFO" });
    recs.push({ priority: "LOW", text: "Continue regular system maintenance to sustain performance.", type: "MAINTENANCE" });
  }
  return recs;
}

function buildRamBreakdown(ramGB, score, health) {
  const ratio = score / MAX_SCORES.ram;
  const reusability = isComponentReusable("ram", ramGB);

  const capacityTier = ramGB >= 16 ? "High Capacity" : ramGB >= 8 ? "Standard" : ramGB >= 4 ? "Basic" : "Insufficient";
  const browserTabs = Math.max(1, Math.floor(ramGB * 5));
  const suitableFor = ramGB >= 16 ? "Video Editing, VMs, Development" : ramGB >= 8 ? "General Use, Light Development" : ramGB >= 4 ? "Basic Browsing, Office" : "Very Limited Use";

  return {
    name: "RAM",
    icon: "💾",
    rawValue: ramGB,
    unit: "GB",
    score,
    maxScore: MAX_SCORES.ram,
    scorePercent: pct(score, MAX_SCORES.ram),
    health,
    weight: WEIGHTS.ram,
    weightPercent: WEIGHTS.ram * 100,
    reusability,
    subMetrics: [
      { label: "Capacity Tier", value: capacityTier, status: ramGB >= 8 ? "GOOD" : ramGB >= 4 ? "FAIR" : "POOR" },
      { label: "Installed Memory", value: `${ramGB} GB`, status: health },
      { label: "Est. Browser Tabs", value: `~${browserTabs} tabs`, status: ramGB >= 8 ? "GOOD" : "FAIR" },
      { label: "Suitable For", value: suitableFor, status: ramGB >= 8 ? "GOOD" : "FAIR" },
      { label: "Contribution Weight", value: `${WEIGHTS.ram * 100}%`, status: "GOOD" }
    ],
    coreChecks: buildRamCoreChecks(ramGB),
    recommendations: getRamRecommendations(ramGB, health),
    longevity: {
      estimatedYears: health === "GOOD" ? 5 : health === "FAIR" ? 3 : 1.5,
      riskLevel: health === "POOR" ? "HIGH" : health === "FAIR" ? "MEDIUM" : "LOW",
      degradationRate: "Stable (RAM rarely degrades)"
    },
    summary: `RAM capacity is ${ramGB} GB, scoring ${score}/${MAX_SCORES.ram}. ${reusability.verdict}.`
  };
}

function getRamRecommendations(ramGB, health) {
  const recs = [];
  if (health === "POOR") {
    recs.push({ priority: "HIGH", text: "RAM is critically low. Upgrade to at least 8 GB for modern use.", type: "UPGRADE" });
    recs.push({ priority: "HIGH", text: "Close memory-heavy applications when not in use.", type: "ACTION" });
    recs.push({ priority: "MEDIUM", text: "Disable startup programs to free up RAM at boot.", type: "ACTION" });
  } else if (health === "FAIR") {
    recs.push({ priority: "MEDIUM", text: "RAM is adequate but could benefit from an upgrade for multitasking.", type: "UPGRADE" });
    recs.push({ priority: "LOW", text: "Monitor memory usage to identify bottlenecks.", type: "MONITOR" });
  } else {
    recs.push({ priority: "LOW", text: "RAM capacity is healthy. No upgrade needed.", type: "INFO" });
    recs.push({ priority: "LOW", text: "RAM modules are highly reusable in other systems.", type: "INFO" });
  }
  return recs;
}

function buildRamCoreChecks(ramGB) {
  const headroom = ramGB >= 16 ? "High" : ramGB >= 8 ? "Moderate" : ramGB >= 4 ? "Low" : "Critical";
  const responsiveness = ramGB >= 12 ? "Snappy" : ramGB >= 6 ? "Acceptable" : "Sluggish";
  const multitaskBuffer = ramGB >= 16 ? "Large" : ramGB >= 8 ? "Medium" : "Small";
  const swapRisk = ramGB >= 8 ? "Low" : ramGB >= 4 ? "Medium" : "High";

  return [
    { label: "Memory Headroom", value: headroom, status: ramGB >= 8 ? "GOOD" : ramGB >= 4 ? "FAIR" : "POOR" },
    { label: "System Responsiveness", value: responsiveness, status: ramGB >= 8 ? "GOOD" : ramGB >= 4 ? "FAIR" : "POOR" },
    { label: "Multitask Buffer", value: multitaskBuffer, status: ramGB >= 8 ? "GOOD" : "FAIR" },
    { label: "Swap Pressure Risk", value: swapRisk, status: ramGB >= 8 ? "GOOD" : ramGB >= 4 ? "FAIR" : "POOR" }
  ];
}

function buildStorageBreakdown(storagePercent, score, health) {
  const ratio = score / MAX_SCORES.storage;
  const reusability = isComponentReusable("storage", storagePercent);

  const freeSpaceEstimate = storagePercent;
  const healthTier = storagePercent >= 80 ? "Excellent" : storagePercent >= 60 ? "Good" : storagePercent >= 40 ? "Aging" : "Critical";
  const dataIntegrity = storagePercent >= 50 ? "Reliable" : "At Risk";
  const readWriteEstimate = storagePercent >= 70 ? "Fast" : storagePercent >= 40 ? "Moderate" : "Slow";

  return {
    name: "Storage",
    icon: "💿",
    rawValue: storagePercent,
    unit: "%",
    score,
    maxScore: MAX_SCORES.storage,
    scorePercent: pct(score, MAX_SCORES.storage),
    health,
    weight: WEIGHTS.storage,
    weightPercent: WEIGHTS.storage * 100,
    reusability,
    subMetrics: [
      { label: "Health Tier", value: healthTier, status: health },
      { label: "Available Health", value: `${storagePercent}%`, status: health },
      { label: "Data Integrity", value: dataIntegrity, status: storagePercent >= 50 ? "GOOD" : "POOR" },
      { label: "Read/Write Speed", value: readWriteEstimate, status: storagePercent >= 40 ? "GOOD" : "POOR" },
      { label: "Contribution Weight", value: `${WEIGHTS.storage * 100}%`, status: "GOOD" }
    ],
    coreChecks: buildStorageCoreChecks(storagePercent),
    recommendations: getStorageRecommendations(storagePercent, health),
    longevity: {
      estimatedYears: health === "GOOD" ? 5 : health === "FAIR" ? 3 : 1,
      riskLevel: health === "POOR" ? "HIGH" : health === "FAIR" ? "MEDIUM" : "LOW",
      degradationRate: health === "GOOD" ? "Minimal" : health === "FAIR" ? "Moderate wear" : "Heavy wear detected"
    },
    summary: `Storage health is at ${storagePercent}%, scoring ${score}/${MAX_SCORES.storage}. ${reusability.verdict}.`
  };
}

function getStorageRecommendations(storagePercent, health) {
  const recs = [];
  if (health === "POOR") {
    recs.push({ priority: "HIGH", text: "Storage health is critical. Back up data immediately.", type: "ACTION" });
    recs.push({ priority: "HIGH", text: "Replace the storage drive as soon as possible.", type: "UPGRADE" });
    recs.push({ priority: "MEDIUM", text: "Run disk health diagnostics (SMART check) for detailed analysis.", type: "DIAGNOSTIC" });
  } else if (health === "FAIR") {
    recs.push({ priority: "MEDIUM", text: "Clean up unused files and applications to improve performance.", type: "ACTION" });
    recs.push({ priority: "LOW", text: "Consider upgrading to an SSD if currently using an HDD.", type: "UPGRADE" });
  } else {
    recs.push({ priority: "LOW", text: "Storage is in good condition. Continue regular maintenance.", type: "INFO" });
    recs.push({ priority: "LOW", text: "Schedule periodic backups to protect data.", type: "MAINTENANCE" });
  }
  return recs;
}

function buildStorageCoreChecks(storagePercent) {
  const wearLevel = storagePercent >= 80 ? "Minimal" : storagePercent >= 60 ? "Low" : storagePercent >= 40 ? "Moderate" : "High";
  const enduranceClass = storagePercent >= 70 ? "Enterprise-Grade" : storagePercent >= 50 ? "Standard" : "Degraded";
  const ioStability = storagePercent >= 60 ? "Stable" : storagePercent >= 40 ? "Variable" : "Unstable";
  const dataRisk = storagePercent >= 50 ? "Low" : storagePercent >= 35 ? "Medium" : "High";

  return [
    { label: "Wear Level", value: wearLevel, status: storagePercent >= 60 ? "GOOD" : storagePercent >= 40 ? "FAIR" : "POOR" },
    { label: "Endurance Class", value: enduranceClass, status: storagePercent >= 50 ? "GOOD" : "FAIR" },
    { label: "I/O Stability", value: ioStability, status: storagePercent >= 60 ? "GOOD" : storagePercent >= 40 ? "FAIR" : "POOR" },
    { label: "Data Integrity Risk", value: dataRisk, status: storagePercent >= 50 ? "GOOD" : storagePercent >= 35 ? "FAIR" : "POOR" }
  ];
}

function buildBatteryBreakdown(batteryPercent, score, health) {
  const ratio = score / MAX_SCORES.battery;
  const reusability = isComponentReusable("battery", batteryPercent);

  const cycleEstimate = batteryPercent >= 80 ? "< 300 cycles" : batteryPercent >= 60 ? "300–600 cycles" : batteryPercent >= 40 ? "600–900 cycles" : "> 900 cycles";
  const chargingHealth = batteryPercent >= 70 ? "Normal" : batteryPercent >= 40 ? "Degraded" : "Severely Degraded";
  const runtimeEstimate = batteryPercent >= 80 ? "4–6 hours" : batteryPercent >= 60 ? "2–4 hours" : batteryPercent >= 40 ? "1–2 hours" : "< 1 hour";
  const swellRisk = batteryPercent < 30 ? "Elevated" : "Normal";

  return {
    name: "Battery",
    icon: "🔋",
    rawValue: batteryPercent,
    unit: "%",
    score,
    maxScore: MAX_SCORES.battery,
    scorePercent: pct(score, MAX_SCORES.battery),
    health,
    weight: WEIGHTS.battery,
    weightPercent: WEIGHTS.battery * 100,
    reusability,
    subMetrics: [
      { label: "Health Level", value: `${batteryPercent}%`, status: health },
      { label: "Est. Cycle Count", value: cycleEstimate, status: batteryPercent >= 60 ? "GOOD" : "FAIR" },
      { label: "Charging Health", value: chargingHealth, status: batteryPercent >= 70 ? "GOOD" : batteryPercent >= 40 ? "FAIR" : "POOR" },
      { label: "Est. Runtime", value: runtimeEstimate, status: batteryPercent >= 60 ? "GOOD" : "FAIR" },
      { label: "Swell Risk", value: swellRisk, status: batteryPercent >= 30 ? "GOOD" : "POOR" }
    ],
    coreChecks: buildBatteryCoreChecks(batteryPercent),
    recommendations: getBatteryRecommendations(batteryPercent, health),
    longevity: {
      estimatedYears: health === "GOOD" ? 3 : health === "FAIR" ? 1.5 : 0.5,
      riskLevel: health === "POOR" ? "HIGH" : health === "FAIR" ? "MEDIUM" : "LOW",
      degradationRate: health === "GOOD" ? "Normal aging" : health === "FAIR" ? "Accelerated" : "End of life approaching"
    },
    summary: `Battery health is at ${batteryPercent}%, scoring ${score}/${MAX_SCORES.battery}. ${reusability.verdict}.`
  };
}

function getBatteryRecommendations(batteryPercent, health) {
  const recs = [];
  if (health === "POOR") {
    recs.push({ priority: "HIGH", text: "Battery is near end of life. Replace immediately to avoid damage.", type: "UPGRADE" });
    recs.push({ priority: "HIGH", text: "Avoid using the device on battery power — keep plugged in.", type: "ACTION" });
    recs.push({ priority: "MEDIUM", text: "Check for battery swelling or physical deformation.", type: "DIAGNOSTIC" });
  } else if (health === "FAIR") {
    recs.push({ priority: "MEDIUM", text: "Battery is aging. Calibrate by fully charging and discharging once a month.", type: "MAINTENANCE" });
    recs.push({ priority: "LOW", text: "Keep charge between 20%–80% to extend battery lifespan.", type: "ACTION" });
  } else {
    recs.push({ priority: "LOW", text: "Battery is healthy. No action required.", type: "INFO" });
    recs.push({ priority: "LOW", text: "Avoid extreme temperatures to maintain battery longevity.", type: "MAINTENANCE" });
  }
  return recs;
}

function buildBatteryCoreChecks(batteryPercent) {
  const chargeRetention = batteryPercent >= 80 ? "Strong" : batteryPercent >= 60 ? "Fair" : batteryPercent >= 40 ? "Weak" : "Failing";
  const voltageStability = batteryPercent >= 70 ? "Stable" : batteryPercent >= 50 ? "Moderate" : "Unstable";
  const thermalRisk = batteryPercent >= 70 ? "Low" : batteryPercent >= 50 ? "Medium" : "High";
  const safetyRisk = batteryPercent >= 50 ? "Low" : batteryPercent >= 35 ? "Medium" : "High";

  return [
    { label: "Charge Retention", value: chargeRetention, status: batteryPercent >= 60 ? "GOOD" : batteryPercent >= 40 ? "FAIR" : "POOR" },
    { label: "Voltage Stability", value: voltageStability, status: batteryPercent >= 70 ? "GOOD" : batteryPercent >= 50 ? "FAIR" : "POOR" },
    { label: "Thermal Risk", value: thermalRisk, status: batteryPercent >= 70 ? "GOOD" : batteryPercent >= 50 ? "FAIR" : "POOR" },
    { label: "Safety Risk", value: safetyRisk, status: batteryPercent >= 50 ? "GOOD" : batteryPercent >= 35 ? "FAIR" : "POOR" }
  ];
}

// ---------- Main API ----------

function evaluateDevice({ cpu, ram, storage, battery }) {
  const rawScores = {
    cpu: scoreCPU(cpu),
    ram: scoreRAM(ram),
    storage: scoreStorage(storage),
    battery: scoreBattery(battery)
  };

  const healths = {
    cpu: getComponentHealth(rawScores.cpu, MAX_SCORES.cpu),
    ram: getComponentHealth(rawScores.ram, MAX_SCORES.ram),
    storage: getComponentHealth(rawScores.storage, MAX_SCORES.storage),
    battery: getComponentHealth(rawScores.battery, MAX_SCORES.battery)
  };

  // Simple component summary (backward compatible)
  const components = {
    cpu: { score: Number(rawScores.cpu.toFixed(2)), health: healths.cpu },
    ram: { score: Number(rawScores.ram.toFixed(2)), health: healths.ram },
    storage: { score: Number(rawScores.storage.toFixed(2)), health: healths.storage },
    battery: { score: Number(rawScores.battery.toFixed(2)), health: healths.battery }
  };

  const totalScore =
    (rawScores.cpu / MAX_SCORES.cpu) * WEIGHTS.cpu * 100 +
    (rawScores.ram / MAX_SCORES.ram) * WEIGHTS.ram * 100 +
    (rawScores.storage / MAX_SCORES.storage) * WEIGHTS.storage * 100 +
    (rawScores.battery / MAX_SCORES.battery) * WEIGHTS.battery * 100;

  // Detailed per-component breakdowns
  const componentBreakdowns = {
    cpu: buildCpuBreakdown(cpu, Number(rawScores.cpu.toFixed(2)), healths.cpu),
    ram: buildRamBreakdown(ram, Number(rawScores.ram.toFixed(2)), healths.ram),
    storage: buildStorageBreakdown(storage, Number(rawScores.storage.toFixed(2)), healths.storage),
    battery: buildBatteryBreakdown(battery, Number(rawScores.battery.toFixed(2)), healths.battery)
  };

  // Overall reusability summary
  const reusableCount = Object.values(componentBreakdowns).filter(c => c.reusability.reusable).length;

  return {
    totalScore: Math.round(totalScore),
    health: getOverallHealth(totalScore),
    components,
    componentBreakdowns,
    reusabilitySummary: {
      totalComponents: 4,
      reusableCount,
      nonReusableCount: 4 - reusableCount,
      overallReusable: isReusable(components, totalScore),
      breakdown: Object.entries(componentBreakdowns).map(([key, val]) => ({
        component: key,
        verdict: val.reusability.verdict,
        reusable: val.reusability.reusable,
        confidence: val.reusability.confidence
      }))
    },
    longevity: {
      yearsRemaining: estimateLongevityYears(totalScore, components),
      sustainability: estimateSustainability(totalScore),
      reusable: isReusable(components, totalScore)
    }
  };
}

// ---------- Exports ----------

module.exports = {
  evaluateDevice,
  scoreCPU,
  scoreRAM,
  scoreStorage,
  scoreBattery,
  isComponentReusable
};
