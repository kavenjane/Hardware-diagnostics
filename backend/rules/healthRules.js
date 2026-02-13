/**
 * Device Health Scoring Engine - Standardized Hardware Reusability Model
 * -----------------------------------------------------------------------
 * Industry-aligned scoring model with 4 evaluation categories:
 * 1. Functional Integrity (40 points) - Component stability & reliability
 * 2. Performance Retention (30 points) - Benchmark performance vs reference
 * 3. Remaining Life / Wear Level (20 points) - Lifespan & degradation
 * 4. Physical & Thermal Condition (10 points) - Physical state & temperatures
 * 
 * Total: 100 points
 * Classification:
 *   85-100: High-grade reusable
 *   70-84:  Reusable (minor upgrades recommended)
 *   50-69:  Limited reuse
 *   <50:    Not recommended for reuse
 */

// ========== CONFIGURATION ==========

const SCORING_CATEGORIES = {
  FUNCTIONAL_INTEGRITY: 40,
  PERFORMANCE_RETENTION: 30,
  REMAINING_LIFE: 20,
  PHYSICAL_THERMAL: 10
};

const REUSABILITY_CLASSIFICATION = {
  HIGH_GRADE: { min: 85, label: "High-grade reusable", description: "Excellent condition, ready for immediate reuse" },
  REUSABLE: { min: 70, label: "Reusable", description: "Good condition, minor upgrades recommended" },
  LIMITED: { min: 50, label: "Limited reuse", description: "Functional but with notable limitations" },
  NOT_RECOMMENDED: { min: 0, label: "Not recommended", description: "Significant issues present, reuse not advised" }
};

// Legacy scoring weights and thresholds
const WEIGHTS = { cpu: 0.30, ram: 0.25, storage: 0.25, battery: 0.20 };
const MAX_SCORES = { cpu: 30, ram: 25, storage: 25, battery: 20 };
const COMPONENT_THRESHOLDS = { good: 0.8, fair: 0.5 };
const OVERALL_THRESHOLDS = { good: 80, fair: 55 };
const REUSABILITY = {
  cpu: { reusableMin: 40, idealMin: 70 },
  ram: { reusableMin: 4, idealMin: 8 },
  storage: { reusableMin: 40, idealMin: 70 },
  battery: { reusableMin: 50, idealMin: 75 }
};

// Lookup tables for scoring rules (more efficient than if-else chains)
const PERFORMANCE_SCORING = [
  { threshold: 95, score: 30 },
  { threshold: 90, score: 25 },
  { threshold: 85, score: 20 },
  { threshold: 80, score: 15 },
  { threshold: 0, score: 5 }
];

const SSD_WEAR_SCORING = [
  { threshold: 20, score: 10 },
  { threshold: 40, score: 7 },
  { threshold: 60, score: 4 },
  { threshold: 100, score: 0 }
];

const BATTERY_HEALTH_SCORING = [
  { threshold: 85, score: 10 },
  { threshold: 70, score: 7 },
  { threshold: 60, score: 4 },
  { threshold: 0, score: 0 }
];

// Thermal thresholds
const THERMAL_LIMITS = {
  normal: { idle: 50, load: 85 },
  critical: { idle: 60, load: 95 }
};

// ========== UTILITIES ==========

// Single definition of utility functions (no duplicates)
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pct = (value, max) => Math.round((value / max) * 100);
const isValidNumber = (value) => typeof value === 'number' && isFinite(value);

/**
 * Score value using lookup table (more efficient than if-else chains)
 */
function scoreLookup(value, rules) {
  for (const rule of rules) {
    if (value >= rule.threshold) return rule.score;
  }
  return 0;
}

/**
 * Input validation with defaults
 */
function normalizeInput(input = {}) {
  return {
    storage_smart_status: input.storage_smart_status || "UNKNOWN",
    ram_test_errors: Math.max(0, input.ram_test_errors ?? 0),
    cpu_stress_stable: input.cpu_stress_stable ?? false,
    cpu_throttling: input.cpu_throttling ?? false,
    gpu_stress_stable: input.gpu_stress_stable ?? false,
    gpu_artifacts: input.gpu_artifacts ?? false,
    performance_percentage: clamp(input.performance_percentage ?? 0, 0, 100),
    ssd_wear_percentage: clamp(input.ssd_wear_percentage ?? 0, 0, 100),
    battery_health_percent: clamp(input.battery_health_percent ?? 0, 0, 100),
    physical_damage: input.physical_damage === true,
    port_integrity: input.port_integrity !== false,
    idle_temperature_celsius: Math.max(0, input.idle_temperature_celsius ?? 0),
    load_temperature_celsius: Math.max(0, input.load_temperature_celsius ?? 0)
  };
}

// ========== STANDARDIZED SCORING FUNCTIONS ==========

/**
 * Category 1: Functional Integrity (40 points)
 * Optimized with early returns and minimal object creation
 */
function scoreFunctionalIntegrity(diag) {
  // Smart status scoring
  const storageScore = diag.storage_smart_status === "GOOD" ? 10 : diag.storage_smart_status === "WARNING" ? 6 : 0;
  
  // RAM error scoring
  const ramScore = diag.ram_test_errors === 0 ? 10 : diag.ram_test_errors === 1 ? 5 : 0;
  
  // CPU stability: if stable get 10, if throttling get 6, else 0
  const cpuScore = diag.cpu_stress_stable === true ? 10 : diag.cpu_stress_stable === false && diag.cpu_throttling ? 6 : 0;
  
  // GPU stability
  const gpuScore = diag.gpu_stress_stable === true ? 10 : diag.gpu_stress_stable === false && diag.gpu_artifacts ? 5 : 0;
  
  const score = storageScore + ramScore + cpuScore + gpuScore;
  
  return {
    score: clamp(score, 0, SCORING_CATEGORIES.FUNCTIONAL_INTEGRITY),
    details: {
      storage: { score: storageScore, max: 10, status: diag.storage_smart_status },
      ram: { score: ramScore, max: 10, errors: diag.ram_test_errors },
      cpu: { score: cpuScore, max: 10, stable: diag.cpu_stress_stable, throttling: diag.cpu_throttling },
      gpu: { score: gpuScore, max: 10, stable: diag.gpu_stress_stable, artifacts: diag.gpu_artifacts }
    }
  };
}

/**
 * Category 2: Performance Retention (30 points)
 * Uses lookup table for scoring rules
 */
function scorePerformanceRetention(diag) {
  const perfPercent = diag.performance_percentage ?? 0;
  const score = perfPercent > 0 ? scoreLookup(perfPercent, PERFORMANCE_SCORING) : 0;
  
  return {
    score: clamp(score, 0, SCORING_CATEGORIES.PERFORMANCE_RETENTION),
    details: { performancePercent: perfPercent, benchmarkStatus: perfPercent > 0 ? "EVALUATED" : "NO_DATA" }
  };
}

/**
 * Category 3: Remaining Life / Wear Level (20 points)
 * Optimized with lookup tables
 */
function scoreRemainingLife(diag) {
  const ssdScore = scoreLookup(100 - (diag.ssd_wear_percentage ?? 0), SSD_WEAR_SCORING);
  const batteryScore = scoreLookup(diag.battery_health_percent ?? 0, BATTERY_HEALTH_SCORING);
  const score = ssdScore + batteryScore;
  
  return {
    score: clamp(score, 0, SCORING_CATEGORIES.REMAINING_LIFE),
    details: {
      ssd: { score: ssdScore, max: 10, wearPercent: diag.ssd_wear_percentage ?? 0 },
      battery: { score: batteryScore, max: 10, healthPercent: diag.battery_health_percent ?? 0 }
    }
  };
}

/**
 * Category 4: Physical & Thermal Condition (10 points)
 * Optimized with early exit penalties
 */
function scorePhysicalThermal(diag) {
  let score = 10;
  let thermalStatus = "NORMAL";
  
  // Apply deductions
  if (diag.physical_damage === true) score -= 4;
  if (diag.port_integrity === false) score -= 2;
  
  // Thermal assessment
  const { idle: idleLimit, load: loadLimit } = THERMAL_LIMITS.normal;
  const { idle: criticalIdle, load: criticalLoad } = THERMAL_LIMITS.critical;
  const idleTemp = diag.idle_temperature_celsius ?? 0;
  const loadTemp = diag.load_temperature_celsius ?? 0;
  
  if (idleTemp > criticalIdle || loadTemp > criticalLoad) {
    score -= 4;
    thermalStatus = "CRITICAL";
  } else if (idleTemp > idleLimit || loadTemp > loadLimit) {
    score -= 2;
    thermalStatus = "CONCERNING";
  }
  
  return {
    score: clamp(score, 0, SCORING_CATEGORIES.PHYSICAL_THERMAL),
    details: {
      physicalDamage: diag.physical_damage || false,
      portIntegrity: diag.port_integrity !== false,
      thermalStatus,
      idleTemp,
      loadTemp
    }
  };
}

/**
 * Classify reusability based on total score
 * Uses binary search-like logic instead of multiple if-else
 */
function classifyReusability(totalScore) {
  const classifications = Object.values(REUSABILITY_CLASSIFICATION).sort((a, b) => b.min - a.min);
  for (const classification of classifications) {
    if (totalScore >= classification.min) return classification;
  }
  return REUSABILITY_CLASSIFICATION.NOT_RECOMMENDED;
}

// ========== LEGACY SCORING FUNCTIONS (Backward Compatible) ==========

const scoreCPU = (percent) => clamp((percent / 100) * MAX_SCORES.cpu, 0, MAX_SCORES.cpu);
const scoreRAM = (ramGB) => clamp((Math.min(ramGB, 32) / 32) * MAX_SCORES.ram, 0, MAX_SCORES.ram);
const scoreStorage = (percent) => clamp((percent / 100) * MAX_SCORES.storage, 0, MAX_SCORES.storage);
const scoreBattery = (percent) => {
  const normalized = clamp(percent / 100, 0, 1);
  return Math.pow(normalized, 1.8) * MAX_SCORES.battery;
};

// ========== HEALTH DERIVATION ==========

const getComponentHealth = (score, maxScore) => {
  const ratio = score / maxScore;
  if (ratio >= COMPONENT_THRESHOLDS.good) return "GOOD";
  return ratio >= COMPONENT_THRESHOLDS.fair ? "FAIR" : "POOR";
};

const getOverallHealth = (totalScore) => {
  if (totalScore >= OVERALL_THRESHOLDS.good) return "GOOD";
  return totalScore >= OVERALL_THRESHOLDS.fair ? "FAIR" : "POOR";
};

// Penalty multipliers for longevity calculation
const LONGEVITY_PENALTIES = {
  GOOD: 1,
  FAIR: { battery: 0.85, cpu: 0.85, storage: 0.8, ram: 0.85 },
  POOR: { battery: 0.6, cpu: 0.7, storage: 0.8, ram: 0.85 }
};

function estimateLongevityYears(totalScore, components) {
  const baseYears = (clamp(totalScore, 0, 100) / 100) * 6;
  const penalties = {
    battery: LONGEVITY_PENALTIES[components?.battery?.health] || LONGEVITY_PENALTIES.POOR.battery,
    cpu: LONGEVITY_PENALTIES[components?.cpu?.health] || LONGEVITY_PENALTIES.POOR.cpu,
    storage: LONGEVITY_PENALTIES[components?.storage?.health] || LONGEVITY_PENALTIES.POOR.storage,
    ram: LONGEVITY_PENALTIES[components?.ram?.health] || LONGEVITY_PENALTIES.POOR.ram
  };
  
  const adjusted = Math.max(0, baseYears * Object.values(penalties).reduce((a, b) => a * b, 1));
  return Math.round(adjusted * 10) / 10;
}

const estimateSustainability = (totalScore) => 
  totalScore >= 80 ? "HIGH" : totalScore >= 55 ? "MEDIUM" : "LOW";

const isReusable = (components, totalScore) =>
  totalScore >= 60 && !Object.values(components).some((c) => c.health === "POOR");

// ========== REUSABILITY ASSESSMENT ==========

function isComponentReusable(component, rawValue) {
  const thresholds = REUSABILITY[component];
  if (!thresholds) return { reusable: false, confidence: 0, verdict: "UNKNOWN" };

  if (rawValue >= thresholds.idealMin) return { reusable: true, confidence: 95, verdict: "FULLY REUSABLE" };
  if (rawValue >= thresholds.reusableMin) return { reusable: true, confidence: 65, verdict: "CONDITIONALLY REUSABLE" };
  return { reusable: false, confidence: 90, verdict: "NOT REUSABLE" };
}

// ========== MAIN API ==========

/**
 * Legacy evaluation function - maintains backward compatibility
 */
function evaluateDevice({ cpu, ram, storage, battery }) {
  // Score components
  const rawScores = {
    cpu: scoreCPU(cpu),
    ram: scoreRAM(ram),
    storage: scoreStorage(storage),
    battery: scoreBattery(battery)
  };

  // Derive health status
  const healths = {
    cpu: getComponentHealth(rawScores.cpu, MAX_SCORES.cpu),
    ram: getComponentHealth(rawScores.ram, MAX_SCORES.ram),
    storage: getComponentHealth(rawScores.storage, MAX_SCORES.storage),
    battery: getComponentHealth(rawScores.battery, MAX_SCORES.battery)
  };

  // Create component summary
  const components = {
    cpu: { score: Number(rawScores.cpu.toFixed(2)), health: healths.cpu },
    ram: { score: Number(rawScores.ram.toFixed(2)), health: healths.ram },
    storage: { score: Number(rawScores.storage.toFixed(2)), health: healths.storage },
    battery: { score: Number(rawScores.battery.toFixed(2)), health: healths.battery }
  };

  // Calculate weighted total score
  const totalScore =
    (rawScores.cpu / MAX_SCORES.cpu) * WEIGHTS.cpu * 100 +
    (rawScores.ram / MAX_SCORES.ram) * WEIGHTS.ram * 100 +
    (rawScores.storage / MAX_SCORES.storage) * WEIGHTS.storage * 100 +
    (rawScores.battery / MAX_SCORES.battery) * WEIGHTS.battery * 100;

  // Build component breakdowns
  const componentBreakdowns = {
    cpu: buildLegacyComponentBreakdown("cpu", "🔧", cpu, rawScores.cpu, healths.cpu),
    ram: buildLegacyComponentBreakdown("ram", "💾", ram, rawScores.ram, healths.ram),
    storage: buildLegacyComponentBreakdown("storage", "💿", storage, rawScores.storage, healths.storage),
    battery: buildLegacyComponentBreakdown("battery", "🔋", battery, rawScores.battery, healths.battery)
  };

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

/**
 * Optimized generic breakdown builder for legacy components
 */
function buildLegacyComponentBreakdown(componentName, icon, rawValue, score, health) {
  const config = {
    cpu: { max: MAX_SCORES.cpu, weight: WEIGHTS.cpu, unit: "%", suggestions: buildCpuSuggestions },
    ram: { max: MAX_SCORES.ram, weight: WEIGHTS.ram, unit: "GB", suggestions: buildRamSuggestions },
    storage: { max: MAX_SCORES.storage, weight: WEIGHTS.storage, unit: "%", suggestions: buildStorageSuggestions },
    battery: { max: MAX_SCORES.battery, weight: WEIGHTS.battery, unit: "%", suggestions: buildBatterySuggestions }
  };

  const { max, weight, suggestions } = config[componentName];
  const reusability = isComponentReusable(componentName, rawValue);
  const { subMetrics, coreChecks, recommendations, longevity } = suggestions(rawValue, health);

  return {
    name: componentName.toUpperCase(),
    icon,
    rawValue,
    unit: config[componentName].unit,
    score,
    maxScore: max,
    scorePercent: pct(score, max),
    health,
    weight,
    weightPercent: weight * 100,
    reusability,
    subMetrics,
    coreChecks: coreChecks || [],
    recommendations,
    longevity,
    summary: `${componentName} scoring ${score}/${max}. ${reusability.verdict}.`
  };
}

// Fast suggestion builders (only build what's needed)
const SUGGESTION_BUILDERS = {
  cpu: (val, health) => ({
    subMetrics: [
      { label: "Performance Tier", value: val >= 80 ? "High" : val >= 50 ? "Mid" : "Low", status: val >= 50 ? "GOOD" : "FAIR" },
      { label: "Processing Power", value: `${val}%`, status: health },
      { label: "Multitasking", value: val >= 70 ? "Strong" : val >= 40 ? "Moderate" : "Limited", status: val >= 40 ? "GOOD" : "POOR" }
    ],
    recommendations: health === "POOR" 
      ? [{ priority: "HIGH", text: "CPU performance critically low. Consider upgrading.", type: "UPGRADE" }]
      : health === "FAIR"
      ? [{ priority: "MEDIUM", text: "CPU aging. Monitor for degradation.", type: "MONITOR" }]
      : [{ priority: "LOW", text: "CPU performing well.", type: "INFO" }],
    longevity: {
      estimatedYears: health === "GOOD" ? 4.5 : health === "FAIR" ? 2.5 : 1,
      riskLevel: health === "POOR" ? "HIGH" : health === "FAIR" ? "MEDIUM" : "LOW",
      degradationRate: health === "GOOD" ? "Slow" : health === "FAIR" ? "Moderate" : "Rapid"
    }
  }),
  ram: (val, health) => ({
    subMetrics: [
      { label: "Capacity", value: val >= 16 ? "High" : val >= 8 ? "Standard" : val >= 4 ? "Basic" : "Low", status: val >= 8 ? "GOOD" : val >= 4 ? "FAIR" : "POOR" },
      { label: "Memory", value: `${val} GB`, status: health },
      { label: "Suitable For", value: val >= 16 ? "Video/Dev" : val >= 8 ? "General" : "Basic", status: val >= 8 ? "GOOD" : "FAIR" }
    ],
    recommendations: health === "POOR"
      ? [{ priority: "HIGH", text: "RAM critically low. Upgrade to 8GB+.", type: "UPGRADE" }]
      : health === "FAIR"
      ? [{ priority: "MEDIUM", text: "RAM adequate but consider upgrade.", type: "UPGRADE" }]
      : [{ priority: "LOW", text: "RAM capacity healthy.", type: "INFO" }],
    longevity: {
      estimatedYears: health === "GOOD" ? 5 : health === "FAIR" ? 3 : 1.5,
      riskLevel: health === "POOR" ? "HIGH" : health === "FAIR" ? "MEDIUM" : "LOW",
      degradationRate: "Stable"
    }
  }),
  storage: (val, health) => ({
    subMetrics: [
      { label: "Health", value: val >= 80 ? "Excellent" : val >= 60 ? "Good" : val >= 40 ? "Aging" : "Critical", status: health },
      { label: "Health %", value: `${val}%`, status: health },
      { label: "Data Integrity", value: val >= 50 ? "Reliable" : "At Risk", status: val >= 50 ? "GOOD" : "POOR" }
    ],
    coreChecks: [
      { label: "Wear Level", value: val >= 60 ? "Low" : val >= 40 ? "Moderate" : "High", status: val >= 60 ? "GOOD" : val >= 40 ? "FAIR" : "POOR" },
      { label: "I/O Stability", value: val >= 60 ? "Stable" : val >= 40 ? "Variable" : "Unstable", status: val >= 60 ? "GOOD" : val >= 40 ? "FAIR" : "POOR" }
    ],
    recommendations: health === "POOR"
      ? [{ priority: "HIGH", text: "Storage critical. Back up immediately and replace.", type: "ACTION" }]
      : health === "FAIR"
      ? [{ priority: "MEDIUM", text: "Clean up unused files. Consider SSD upgrade.", type: "ACTION" }]
      : [{ priority: "LOW", text: "Storage in good condition.", type: "INFO" }],
    longevity: {
      estimatedYears: health === "GOOD" ? 5 : health === "FAIR" ? 3 : 1,
      riskLevel: health === "POOR" ? "HIGH" : health === "FAIR" ? "MEDIUM" : "LOW",
      degradationRate: health === "GOOD" ? "Minimal" : health === "FAIR" ? "Moderate" : "Heavy"
    }
  }),
  battery: (val, health) => ({
    subMetrics: [
      { label: "Health", value: `${val}%`, status: health },
      { label: "Cycle Est.", value: val >= 80 ? "<300" : val >= 60 ? "300-600" : ">600", status: val >= 60 ? "GOOD" : "FAIR" },
      { label: "Runtime", value: val >= 80 ? "4-6h" : val >= 60 ? "2-4h" : val >= 40 ? "1-2h" : "<1h", status: val >= 60 ? "GOOD" : "FAIR" }
    ],
    coreChecks: [
      { label: "Charge Retention", value: val >= 80 ? "Strong" : val >= 60 ? "Fair" : "Weak", status: val >= 60 ? "GOOD" : val >= 40 ? "FAIR" : "POOR" },
      { label: "Safety", value: val >= 50 ? "Safe" : "High Risk", status: val >= 50 ? "GOOD" : "POOR" }
    ],
    recommendations: health === "POOR"
      ? [{ priority: "HIGH", text: "Battery near end of life. Replace immediately.", type: "UPGRADE" }]
      : health === "FAIR"
      ? [{ priority: "MEDIUM", text: "Battery aging. Calibrate monthly.", type: "MAINTENANCE" }]
      : [{ priority: "LOW", text: "Battery healthy.", type: "INFO" }],
    longevity: {
      estimatedYears: health === "GOOD" ? 3 : health === "FAIR" ? 1.5 : 0.5,
      riskLevel: health === "POOR" ? "HIGH" : health === "FAIR" ? "MEDIUM" : "LOW",
      degradationRate: health === "GOOD" ? "Normal" : health === "FAIR" ? "Accelerated" : "End of life"
    }
  })
};

// Lookup builder functions
const buildCpuSuggestions = (val, h) => SUGGESTION_BUILDERS.cpu(val, h);
const buildRamSuggestions = (val, h) => SUGGESTION_BUILDERS.ram(val, h);
const buildStorageSuggestions = (val, h) => SUGGESTION_BUILDERS.storage(val, h);
const buildBatterySuggestions = (val, h) => SUGGESTION_BUILDERS.battery(val, h);

/**
 * Standardized evaluation function - professional hardware reusability scoring
 */
function evaluateDeviceStandardized(diagnostics) {
  const diag = normalizeInput(diagnostics);

  // Calculate category scores
  const functional = scoreFunctionalIntegrity(diag);
  const performance = scorePerformanceRetention(diag);
  const remaining = scoreRemainingLife(diag);
  const physical = scorePhysicalThermal(diag);

  const totalScore = functional.score + performance.score + remaining.score + physical.score;
  const classification = classifyReusability(totalScore);

  return {
    model: "STANDARDIZED_REUSABILITY_EVALUATION",
    totalScore,
    classification: {
      level: classification.label,
      description: classification.description,
      minScore: classification.min,
      tier: totalScore >= 85 ? "HIGH_GRADE" : totalScore >= 70 ? "REUSABLE" : totalScore >= 50 ? "LIMITED" : "NOT_RECOMMENDED"
    },
    categories: {
      functionalIntegrity: { label: "Functional Integrity", score: functional.score, maxScore: SCORING_CATEGORIES.FUNCTIONAL_INTEGRITY, percentage: pct(functional.score, SCORING_CATEGORIES.FUNCTIONAL_INTEGRITY), details: functional.details },
      performanceRetention: { label: "Performance Retention", score: performance.score, maxScore: SCORING_CATEGORIES.PERFORMANCE_RETENTION, percentage: performance.details.performancePercent || 0, details: performance.details },
      remainingLife: { label: "Remaining Life / Wear Level", score: remaining.score, maxScore: SCORING_CATEGORIES.REMAINING_LIFE, percentage: pct(remaining.score, SCORING_CATEGORIES.REMAINING_LIFE), details: remaining.details },
      physicalThermal: { label: "Physical & Thermal Condition", score: physical.score, maxScore: SCORING_CATEGORIES.PHYSICAL_THERMAL, percentage: pct(physical.score, SCORING_CATEGORIES.PHYSICAL_THERMAL), details: physical.details }
    },
    summary: `Score: ${totalScore}/100 | ${classification.label} | ${classification.description}`,
    calculations: {
      functionalIntegrity: `${functional.score}/${SCORING_CATEGORIES.FUNCTIONAL_INTEGRITY}`,
      performanceRetention: `${performance.score}/${SCORING_CATEGORIES.PERFORMANCE_RETENTION}`,
      remainingLife: `${remaining.score}/${SCORING_CATEGORIES.REMAINING_LIFE}`,
      physicalThermal: `${physical.score}/${SCORING_CATEGORIES.PHYSICAL_THERMAL}`,
      total: `${totalScore}/100`
    },
    recommendedActions: generateRecommendations(totalScore, classification, functional, remaining, physical)
  };
}

/**
 * Generate recommendations efficiently using early exit pattern
 */
function generateRecommendations(score, classification, functional, remaining, physical) {
  const recs = [];

  // Critical level
  if (score < 50) recs.push({ priority: "CRITICAL", action: "DO NOT REUSE", description: "Significant issues prevent safe reuse." });

  // Hardware failures
  if (functional.details.storage?.score < 5) recs.push({ priority: "HIGH", action: "REPLACE STORAGE", description: "Critical SMART failures detected." });
  if (functional.details.ram?.errors > 0) recs.push({ priority: "HIGH", action: "REPLACE RAM", description: `${functional.details.ram.errors} memory errors found.` });
  if (!functional.details.cpu?.stable) recs.push({ priority: "HIGH", action: "CPU FAILED", description: "CPU stability test failed." });

  // Wear issues
  if (remaining.details.ssd?.wearPercent > 80) recs.push({ priority: "HIGH", action: "SSD END OF LIFE", description: `SSD wear at ${remaining.details.ssd.wearPercent}%.` });
  if (remaining.details.battery?.healthPercent < 60) recs.push({ priority: "HIGH", action: "REPLACE BATTERY", description: "Battery critically low." });

  // Thermal/physical
  if (physical.details.thermalStatus === "CRITICAL") recs.push({ priority: "HIGH", action: "THERMAL ISSUE", description: `Temps critical: ${physical.details.idleTemp}°C idle, ${physical.details.loadTemp}°C load.` });
  if (physical.details.physicalDamage) recs.push({ priority: "MEDIUM", action: "INSPECT DAMAGE", description: "Physical damage detected." });

  // Positive recommendations
  if (score >= 85) recs.push({ priority: "LOW", action: "READY FOR REUSE", description: "Excellent condition." });
  else if (score >= 70) recs.push({ priority: "LOW", action: "MINOR UPGRADES", description: "Consider component upgrades." });
  else if (score >= 50) recs.push({ priority: "MEDIUM", action: "LIMITED USE", description: "Non-critical applications only." });

  return recs;
}

// ========== EXPORTS ==========

module.exports = {
  evaluateDevice,
  evaluateDeviceStandardized,
  scoreFunctionalIntegrity,
  scorePerformanceRetention,
  scoreRemainingLife,
  scorePhysicalThermal,
  classifyReusability,
  scoreCPU,
  scoreRAM,
  scoreStorage,
  scoreBattery,
  isComponentReusable,
  SCORING_CATEGORIES,
  REUSABILITY_CLASSIFICATION,
  WEIGHTS,
  MAX_SCORES
};

