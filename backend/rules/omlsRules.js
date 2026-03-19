/**
 * Open Modular Laptop Standard (OMLS) Rule Engine
 * Implements validation rules for modular component compatibility.
 */

const COMPONENT_TYPES = new Set([
  "CPU",
  "GPU",
  "RAM",
  "STORAGE",
  "BATTERY",
  "DISPLAY",
  "IO",
  "MOTHERBOARD"
]);

const REQUIRED_METADATA_FIELDS = [
  "component_id",
  "component_type",
  "form_factor",
  "connector_type",
  "power_input",
  "thermal_profile",
  "firmware_version",
  "compatibility_tags",
  "generation",
  "manufacturer_id"
];

const FORM_FACTOR_LIMITS = {
  "FF-RAM-SODIMM-S": { maxLengthMm: 70, maxWidthMm: 35, maxHeightMm: 4 },
  "FF-STORAGE-M2-2280": { maxLengthMm: 80, maxWidthMm: 22, maxHeightMm: 4 },
  "FF-BATTERY-LAPTOP-M": { maxLengthMm: 260, maxWidthMm: 120, maxHeightMm: 12 },
  "FF-GPU-MODULE-SLIM": { maxLengthMm: 120, maxWidthMm: 70, maxHeightMm: 8 }
};

const STANDARD_IDENTIFICATION_INTERFACES = new Set([
  "PCIe",
  "USB",
  "SMBUS",
  "I2C",
  "NVMe",
  "SATA",
  "ACPI"
]);

const DATA_REQUIRED_COMPONENTS = new Set(["CPU", "GPU", "RAM", "STORAGE", "IO", "DISPLAY", "MOTHERBOARD"]);
const HIGH_POWER_COMPONENTS = new Set(["CPU", "GPU"]);

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizePowerRange(value) {
  if (Array.isArray(value) && value.length >= 2) {
    return { min: toNumber(value[0]), max: toNumber(value[1]) };
  }

  if (value && typeof value === "object") {
    return {
      min: toNumber(value.min, 0),
      max: toNumber(value.max, 0)
    };
  }

  return { min: 0, max: 0 };
}

function intersect(arrA = [], arrB = []) {
  if (!Array.isArray(arrA) || !Array.isArray(arrB)) return [];
  const b = new Set(arrB);
  return arrA.filter((item) => b.has(item));
}

function addResult(results, ruleId, status, message) {
  results.push({ ruleId, status, message });
}

function hasDestructiveMethod(component = {}) {
  const method = String(component.removal_method || "").toLowerCase();
  return method.includes("glue") || method.includes("solder");
}

function evaluateMetadata(component, results) {
  const missing = REQUIRED_METADATA_FIELDS.filter((field) => component[field] == null);

  if (missing.length > 0) {
    addResult(results, "G2", "FAIL", `Missing metadata fields: ${missing.join(", ")}`);
    return;
  }

  if (!COMPONENT_TYPES.has(component.component_type)) {
    addResult(results, "G2", "FAIL", `Unsupported component_type: ${component.component_type}`);
    return;
  }

  if (!Array.isArray(component.compatibility_tags)) {
    addResult(results, "G2", "FAIL", "compatibility_tags must be an array");
    return;
  }

  addResult(results, "G2", "PASS", "Standardized metadata profile is present");
}

function evaluateGlobalRules(component, system, results) {
  if (component.removable === false || hasDestructiveMethod(component)) {
    addResult(results, "G1", "FAIL", "Component is not removable without destructive methods");
  } else {
    addResult(results, "G1", "PASS", "Component is removable without destructive methods");
  }

  const publicInterface = component.interface_public !== false && component.proprietary_interface !== true;
  if (!publicInterface) {
    addResult(results, "G3", "FAIL", "Interface is proprietary or not publicly documented");
  } else {
    addResult(results, "G3", "PASS", "Interfaces are public and non-proprietary");
  }

  const motherboardGeneration = toNumber(system?.motherboard?.supported_generation, NaN);
  const componentGeneration = toNumber(component.generation, NaN);

  const generationCompatible = Number.isFinite(motherboardGeneration) && Number.isFinite(componentGeneration)
    ? Math.abs(componentGeneration - motherboardGeneration) <= 2
    : false;

  if (!generationCompatible) {
    addResult(results, "G4", "FAIL", "Generation compatibility exceeds 2 generations or data is missing");
  } else {
    addResult(results, "G4", "PASS", "Generation compatibility rule satisfied");
  }
}

function evaluateFormFactor(component, slot, system, results) {
  const ff = component.form_factor;

  if (typeof ff !== "string" || !ff.startsWith("FF-")) {
    addResult(results, "F1", "FAIL", "Component form factor is not a standard FF-* code");
  } else {
    addResult(results, "F1", "PASS", "Form factor uses standardized code");
  }

  const limits = FORM_FACTOR_LIMITS[ff];
  const dimensions = component.physical_dimensions || component.dimensions;

  if (limits && dimensions) {
    const lengthMm = toNumber(dimensions.length_mm);
    const widthMm = toNumber(dimensions.width_mm);
    const heightMm = toNumber(dimensions.height_mm);

    const withinLimits =
      lengthMm <= limits.maxLengthMm &&
      widthMm <= limits.maxWidthMm &&
      heightMm <= limits.maxHeightMm;

    if (!withinLimits) {
      addResult(results, "F2", "FAIL", "Physical dimensions exceed form factor limits");
    } else {
      addResult(results, "F2", "PASS", "Physical dimensions are within form factor limits");
    }
  } else {
    addResult(results, "F2", "WARNING", "Dimension or form factor limit data unavailable; skipping strict size check");
  }

  const expectedGrid = slot?.mounting_grid || system?.standard_mounting_grid;
  if (!expectedGrid) {
    addResult(results, "F3", "WARNING", "No mounting grid reference provided");
    return;
  }

  if (component.mounting_grid === expectedGrid || component.mounting_points_aligned === true) {
    addResult(results, "F3", "PASS", "Mounting points align with standard grid system");
  } else {
    addResult(results, "F3", "FAIL", "Mounting points do not align with required grid");
  }
}

function evaluateConnector(component, slot, results) {
  if (!slot || !slot.connector_type) {
    addResult(results, "C1", "WARNING", "Target slot connector is missing; cannot verify exact match");
  } else if (component.connector_type !== slot.connector_type) {
    addResult(results, "C1", "FAIL", "Component connector does not match slot connector");
  } else {
    addResult(results, "C1", "PASS", "Connector matches target slot connector");
  }

  const supportsPower = component.connector_supports_power !== false;
  const requiresData = component.data_required != null
    ? Boolean(component.data_required)
    : DATA_REQUIRED_COMPONENTS.has(component.component_type);
  const supportsData = component.connector_supports_data !== false;

  if (!supportsPower || (requiresData && !supportsData)) {
    addResult(results, "C2", "FAIL", "Connector capabilities do not meet power/data requirements");
  } else {
    addResult(results, "C2", "PASS", "Connector supports required power/data capabilities");
  }

  if (component.proprietary_locking_mechanism === true) {
    addResult(results, "C3", "FAIL", "Proprietary locking mechanism is not allowed");
  } else {
    addResult(results, "C3", "PASS", "No proprietary locking mechanism detected");
  }
}

function evaluatePower(component, slot, system, results) {
  const inputRange = normalizePowerRange(component.power_input);
  const outputRange = normalizePowerRange(slot?.power_output);

  if (outputRange.max > 0) {
    const inRange = inputRange.min >= outputRange.min && inputRange.max <= outputRange.max;
    if (!inRange) {
      addResult(results, "P1", "FAIL", "component.power_input is outside slot.power_output range");
    } else {
      addResult(results, "P1", "PASS", "Component power input is within slot output range");
    }
  } else {
    addResult(results, "P1", "WARNING", "Slot power output range missing; strict power-input check skipped");
  }

  const totalPower = toNumber(system?.total_system_power_draw_watts, 0);
  const batteryLimit = toNumber(system?.battery_power_limit_watts, 0);
  const adapterLimit = toNumber(system?.adapter_power_limit_watts, 0);

  if (totalPower > 0 && (batteryLimit > 0 || adapterLimit > 0)) {
    const sourceLimit = batteryLimit + adapterLimit;
    if (totalPower > sourceLimit) {
      addResult(results, "P2", "FAIL", "Total system power exceeds battery + adapter capacity");
    } else {
      addResult(results, "P2", "PASS", "Total system power is within source capacity");
    }
  } else {
    addResult(results, "P2", "WARNING", "System power envelope data incomplete; strict total power check skipped");
  }

  if (HIGH_POWER_COMPONENTS.has(component.component_type) && !Number.isFinite(toNumber(component.peak_load_watts, NaN))) {
    addResult(results, "P3", "FAIL", "High-power component must declare peak_load_watts");
  } else {
    addResult(results, "P3", "PASS", "Peak load declaration rule satisfied");
  }
}

function evaluateThermal(component, system, results) {
  const thermalProfile = toNumber(component.thermal_profile, 0);
  const thermalCapacity = toNumber(system?.cooling_system?.max_thermal_capacity, 0);

  if (thermalCapacity > 0) {
    if (thermalProfile > thermalCapacity) {
      addResult(results, "T1", "FAIL", "Component thermal profile exceeds cooling capacity");
    } else {
      addResult(results, "T1", "PASS", "Thermal profile is within cooling capacity");
    }
  } else {
    addResult(results, "T1", "WARNING", "Cooling capacity not provided; strict thermal limit check skipped");
  }

  const threshold = toNumber(system?.cooling_system?.enhanced_threshold, 0);
  const enhancedCoolingPresent =
    Boolean(component.enhanced_cooling_required === false) ||
    Boolean(component.enhanced_cooling_module === true) ||
    Boolean(system?.cooling_system?.enhanced_module_installed === true);

  if (threshold > 0 && thermalProfile > threshold && !enhancedCoolingPresent) {
    addResult(results, "T2", "FAIL", "Enhanced cooling module required for this thermal profile");
  } else {
    addResult(results, "T2", "PASS", "Enhanced cooling requirement satisfied");
  }
}

function evaluateGenerationCompatibility(component, system, results) {
  const motherboardGen = toNumber(system?.motherboard?.supported_generation, NaN);
  const componentGen = toNumber(component.generation, NaN);

  if (Number.isFinite(motherboardGen) && Number.isFinite(componentGen)) {
    if (Math.abs(componentGen - motherboardGen) > 2) {
      addResult(results, "GC1", "FAIL", "Generation difference with motherboard exceeds ±2");
    } else {
      addResult(results, "GC1", "PASS", "Generation compatibility is within allowed range");
    }
  } else {
    addResult(results, "GC1", "WARNING", "Generation data incomplete; strict compatibility check skipped");
  }

  const tagIntersection = intersect(component.compatibility_tags, system?.compatibility_tags || system?.tags);
  if (tagIntersection.length === 0) {
    const strict = system?.enforce_tag_intersection === true;
    addResult(results, "GC2", strict ? "FAIL" : "WARNING", "No overlap between component and system compatibility tags");
  } else {
    addResult(results, "GC2", "PASS", `Compatibility tags intersect: ${tagIntersection.join(", ")}`);
  }
}

function evaluateAccessibility(component, results) {
  const standardToolsOrToolless = component.service_method === "TOOL_LESS" || component.service_method === "STANDARD_TOOLS" || component.removal_requires_standard_tools === true;

  if (!standardToolsOrToolless) {
    addResult(results, "H1", "FAIL", "Component is not removable via standard tools or tool-less method");
  } else {
    addResult(results, "H1", "PASS", "Removability method satisfies accessibility rule");
  }

  if (component.requires_full_disassembly === true) {
    addResult(results, "H2", "FAIL", "Component replacement requires full device disassembly");
  } else {
    addResult(results, "H2", "PASS", "No full device disassembly required");
  }
}

function evaluateFirmware(component, results) {
  const hasStandardId =
    component.standard_identification_interface === true ||
    STANDARD_IDENTIFICATION_INTERFACES.has(component.identification_interface);

  if (!hasStandardId) {
    addResult(results, "FW1", "FAIL", "Standard identification interface not declared");
  } else {
    addResult(results, "FW1", "PASS", "Standard identification interface available");
  }

  if (component.plug_and_play_supported !== true) {
    addResult(results, "FW2", "FAIL", "Firmware does not declare plug-and-play support");
  } else {
    addResult(results, "FW2", "PASS", "Plug-and-play detection supported");
  }

  if (component.brand_locking === true) {
    addResult(results, "FW3", "FAIL", "Brand-locking behavior is not allowed");
  } else {
    addResult(results, "FW3", "PASS", "No brand-locking behavior detected");
  }
}

function evaluateReusabilityHealth(component, system, results) {
  const healthStatus = component.health_status;
  const hasHealthStatus = Boolean(healthStatus) && typeof healthStatus === "object" && Object.keys(healthStatus).length > 0;

  if (!hasHealthStatus) {
    addResult(results, "R1", "FAIL", "Component must report health_status metrics");
  } else {
    addResult(results, "R1", "PASS", "Health status metrics are present");
  }

  const reusableModels =
    toNumber(component.reusable_device_model_count, 0);

  if (reusableModels < 2) {
    addResult(results, "R2", "FAIL", "Component must be reusable in at least 2 device models");
  } else {
    addResult(results, "R2", "PASS", `Reusable in ${reusableModels} device models`);
  }

  const scoreThreshold =
    toNumber(system?.minimum_score_threshold, NaN);

  const scoreSet = component.scores || {};
  const scoreValues = [
    toNumber(scoreSet.repairability_score, NaN),
    toNumber(scoreSet.reusability_score, NaN),
    toNumber(scoreSet.openness_score, NaN)
  ];

  const hasScores = scoreValues.some((value) => Number.isFinite(value));
  if (hasScores) {
    const cleanScores = {
      repairability_score: toNumber(scoreSet.repairability_score, 0),
      reusability_score: toNumber(scoreSet.reusability_score, 0),
      openness_score: toNumber(scoreSet.openness_score, 0)
    };

    if (Number.isFinite(scoreThreshold)) {
      const belowThreshold = Object.entries(cleanScores).filter(([, value]) => value < scoreThreshold);
      if (belowThreshold.length > 0) {
        addResult(
          results,
          "SCORE",
          "FAIL",
          `Score below threshold ${scoreThreshold}: ${belowThreshold.map(([key, value]) => `${key}=${value}`).join(", ")}`
        );
      } else {
        addResult(results, "SCORE", "PASS", `All optional scores meet threshold ${scoreThreshold}`);
      }
    } else {
      addResult(results, "SCORE", "PASS", "Optional scoring provided; no threshold enforcement configured");
    }
  }
}

function summarizeResults(results) {
  const failures = results.filter((result) => result.status === "FAIL");
  const warnings = results.filter((result) => result.status === "WARNING");
  const passes = results.filter((result) => result.status === "PASS");

  const totalEvaluated = results.length;
  const complianceScore = totalEvaluated > 0 ? Math.round((passes.length / totalEvaluated) * 100) : 0;

  return {
    pass: failures.length === 0,
    restricted: failures.some((result) => result.ruleId === "SCORE"),
    totals: {
      evaluated: totalEvaluated,
      passed: passes.length,
      failed: failures.length,
      warnings: warnings.length
    },
    complianceScore,
    failures,
    warnings,
    passes
  };
}

function validateComponent(component = {}, slot = {}, system = {}) {
  const results = [];

  evaluateMetadata(component, results);
  evaluateGlobalRules(component, system, results);
  evaluateFormFactor(component, slot, system, results);
  evaluateConnector(component, slot, results);
  evaluatePower(component, slot, system, results);
  evaluateThermal(component, system, results);
  evaluateGenerationCompatibility(component, system, results);
  evaluateAccessibility(component, results);
  evaluateFirmware(component, results);
  evaluateReusabilityHealth(component, system, results);

  const summary = summarizeResults(results);

  return {
    component_id: component.component_id || "UNKNOWN_COMPONENT",
    component_type: component.component_type || "UNKNOWN",
    ...summary,
    ruleResults: results,
    verdict: summary.pass
      ? summary.warnings.length > 0
        ? "PASS_WITH_WARNINGS"
        : "PASS"
      : summary.restricted
      ? "RESTRICTED"
      : "REJECT"
  };
}

function validateOMLSPayload(payload = {}) {
  if (payload.component) {
    const single = validateComponent(payload.component, payload.slot || {}, payload.system || {});
    return {
      model: "OPEN_MODULAR_LAPTOP_STANDARD",
      mode: "single_component",
      result: single,
      overallPass: single.pass,
      complianceScore: single.complianceScore,
      summary: single.verdict
    };
  }

  const components = Array.isArray(payload.components) ? payload.components : [];
  const slots = payload.slots || {};
  const system = payload.system || {};

  const results = components.map((component) => {
    const slot =
      slots[component.component_id] ||
      {};

    return validateComponent(component, slot, system);
  });

  const allPassed = results.every((result) => result.pass);
  const aggregateScore = results.length > 0
    ? Math.round(results.reduce((sum, result) => sum + result.complianceScore, 0) / results.length)
    : 0;

  return {
    model: "OPEN_MODULAR_LAPTOP_STANDARD",
    mode: "multi_component",
    overallPass: allPassed,
    complianceScore: aggregateScore,
    componentsEvaluated: results.length,
    rejectedComponents: results.filter((result) => !result.pass).map((result) => result.component_id),
    warningComponents: results.filter((result) => result.warnings.length > 0).map((result) => result.component_id),
    results
  };
}

function isOMLSPayload(payload = {}) {
  return Boolean(
    payload?.component?.component_id ||
    Array.isArray(payload?.components) ||
    payload?.omls === true
  );
}

module.exports = {
  validateComponent,
  validateOMLSPayload,
  isOMLSPayload
};
