#!/usr/bin/env node

/**
 * Test Suite for Standardized Hardware Reusability Evaluation System
 * Demonstrates both legacy and standardized input formats
 */

const evaluateDevice = require("./services/evaluateDevice");

console.log("=" .repeat(80));
console.log("HARDWARE REUSABILITY EVALUATION SYSTEM - TEST SUITE");
console.log("=" .repeat(80));
console.log();

// ============================================================
// TEST 1: Legacy Input Format (Simple Metrics)
// ============================================================
console.log("TEST 1: LEGACY INPUT FORMAT");
console.log("-" .repeat(80));

const legacyInput = {
  cpu: 65,
  ram: 8,
  storage: 75,
  battery: 80
};

console.log("Input:", JSON.stringify(legacyInput, null, 2));
const legacyResult = evaluateDevice(legacyInput);
console.log("\nResult (Legacy Model):");
console.log(JSON.stringify(legacyResult,  null, 2));
console.log();

// ============================================================
// TEST 2: Standardized Input Format (High-Grade Hardware)
// ============================================================
console.log("TEST 2: STANDARDIZED INPUT - HIGH-GRADE HARDWARE");
console.log("-" .repeat(80));

const standardizedHighGrade = {
  storage_smart_status: "GOOD",
  ram_test_errors: 0,
  cpu_stress_stable: true,
  cpu_throttling: false,
  gpu_stress_stable: true,
  gpu_artifacts: false,
  performance_percentage: 98,
  ssd_wear_percentage: 15,
  battery_health_percent: 92,
  physical_damage: false,
  port_integrity: true,
  idle_temperature_celsius: 35,
  load_temperature_celsius: 72
};

console.log("Input (High-Grade Hardware):");
Object.entries(standardizedHighGrade).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

const standardizedHighResult = evaluateDevice(standardizedHighGrade);
console.log("\nResult (Standardized Model):");
console.log("Total Score:", standardizedHighResult.standardized.totalScore);
console.log("Classification:", standardizedHighResult.standardized.classification.level);
console.log("Description:", standardizedHighResult.standardized.classification.description);
console.log("\nCategory Breakdown:");
Object.entries(standardizedHighResult.standardized.categories).forEach(([key, category]) => {
  console.log(`  ${category.label}: ${category.score}/${category.maxScore} (${category.percentage}%)`);
});
console.log("\nRecommendations:");
standardizedHighResult.standardized.recommendedActions.forEach(rec => {
  console.log(`  [${rec.priority}] ${rec.action}: ${rec.description}`);
});
console.log();

// ============================================================
// TEST 3: Standardized Input Format (Reusable Hardware)
// ============================================================
console.log("TEST 3: STANDARDIZED INPUT - REUSABLE HARDWARE");
console.log("-" .repeat(80));

const standardizedReusable = {
  storage_smart_status: "GOOD",
  ram_test_errors: 0,
  cpu_stress_stable: true,
  cpu_throttling: false,
  gpu_stress_stable: true,
  gpu_artifacts: false,
  performance_percentage: 85,
  ssd_wear_percentage: 35,
  battery_health_percent: 78,
  physical_damage: false,
  port_integrity: true,
  idle_temperature_celsius: 42,
  load_temperature_celsius: 78
};

console.log("Input (Reusable Hardware):");
const standardizedReusableResult = evaluateDevice(standardizedReusable);
console.log("Total Score:", standardizedReusableResult.standardized.totalScore);
console.log("Classification:", standardizedReusableResult.standardized.classification.level);
console.log("Tier:", standardizedReusableResult.standardized.classification.tier);
console.log();

// ============================================================
// TEST 4: Standardized Input Format (Limited Reuse)
// ============================================================
console.log("TEST 4: STANDARDIZED INPUT - LIMITED REUSE HARDWARE");
console.log("-" .repeat(80));

const standardizedLimited = {
  storage_smart_status: "WARNING",
  ram_test_errors: 1,
  cpu_stress_stable: false,
  cpu_throttling: true,
  gpu_stress_stable: true,
  gpu_artifacts: false,
  performance_percentage: 68,
  ssd_wear_percentage: 55,
  battery_health_percent: 62,
  physical_damage: false,
  port_integrity: true,
  idle_temperature_celsius: 55,
  load_temperature_celsius: 88
};

console.log("Input (Limited Reuse Hardware):");
const standardizedLimitedResult = evaluateDevice(standardizedLimited);
console.log("Total Score:", standardizedLimitedResult.standardized.totalScore);
console.log("Classification:", standardizedLimitedResult.standardized.classification.level);
console.log("Tier:", standardizedLimitedResult.standardized.classification.tier);
console.log("\nFunctional Integrity Issues:");
console.log("  - Storage:", standardizedLimited.storage_smart_status);
console.log("  - RAM Test Errors:", standardizedLimited.ram_test_errors);
console.log("  - CPU Stable:", standardizedLimited.cpu_stress_stable, "(Throttling:", standardizedLimited.cpu_throttling + ")");
console.log("\nRecommendations:");
standardizedLimitedResult.standardized.recommendedActions.forEach(rec => {
  console.log(`  [${rec.priority}] ${rec.action}: ${rec.description}`);
});
console.log();

// ============================================================
// TEST 5: Standardized Input Format (Not Recommended)
// ============================================================
console.log("TEST 5: STANDARDIZED INPUT - NOT RECOMMENDED HARDWARE");
console.log("-" .repeat(80));

const standardizedNotRecommended = {
  storage_smart_status: "FAILED",
  ram_test_errors: 5,
  cpu_stress_stable: false,
  cpu_throttling: true,
  gpu_stress_stable: false,
  gpu_artifacts: true,
  performance_percentage: 35,
  ssd_wear_percentage: 85,
  battery_health_percent: 25,
  physical_damage: true,
  port_integrity: false,
  idle_temperature_celsius: 65,
  load_temperature_celsius: 98
};

console.log("Input (Not Recommended Hardware):");
const standardizedNotResult = evaluateDevice(standardizedNotRecommended);
console.log("Total Score:", standardizedNotResult.standardized.totalScore);
console.log("Classification:", standardizedNotResult.standardized.classification.level);
console.log("Tier:", standardizedNotResult.standardized.classification.tier);
console.log("\nCritical Issues:");
Object.entries(standardizedNotRecommended).forEach(([key, value]) => {
  if ((key.includes("status") && value !== "GOOD") ||
      (key.includes("errors") && value > 0) ||
      (key === "cpu_stress_stable" && value === false) ||
      (key === "gpu_stress_stable" && value === false) ||
      (key === "performance_percentage" && value < 50) ||
      (key === "ssd_wear_percentage" && value > 80) ||
      (key === "battery_health_percent" && value < 30) ||
      (key === "physical_damage" && value === true) ||
      (key === "port_integrity" && value === false) ||
      (key.includes("temperature") && value > 90)) {
    console.log(`  ⚠ ${key}: ${value}`);
  }
});
console.log("\nRecommendations:");
standardizedNotResult.standardized.recommendedActions.slice(0, 5).forEach(rec => {
  console.log(`  [${rec.priority}] ${rec.action}: ${rec.description}`);
});
console.log();

// ============================================================
// SUMMARY
// ============================================================
console.log("=" .repeat(80));
console.log("EVALUATION SUMMARY");
console.log("=" .repeat(80));
console.log(`✓ Legacy Model (Test 1):                        Score: ${legacyResult.overall.total_score}/100`);
console.log(`✓ Standardized Model Test 2 (High-Grade):       Score: ${standardizedHighResult.standardized.totalScore}/100 → ${standardizedHighResult.standardized.classification.level}`);
console.log(`✓ Standardized Model Test 3 (Reusable):         Score: ${standardizedReusableResult.standardized.totalScore}/100 → ${standardizedReusableResult.standardized.classification.level}`);
console.log(`✓ Standardized Model Test 4 (Limited):          Score: ${standardizedLimitedResult.standardized.totalScore}/100 → ${standardizedLimitedResult.standardized.classification.level}`);
console.log(`✓ Standardized Model Test 5 (Not Recommended):  Score: ${standardizedNotResult.standardized.totalScore}/100 → ${standardizedNotResult.standardized.classification.level}`);
console.log();
console.log("All tests completed successfully!");
console.log("=" .repeat(80));
