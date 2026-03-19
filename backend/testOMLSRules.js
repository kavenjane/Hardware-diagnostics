#!/usr/bin/env node

const evaluateDevice = require("./services/evaluateDevice");

const compliantPayload = {
  omls: true,
  component: {
    component_id: "CPU-OMLS-001",
    component_type: "CPU",
    form_factor: "FF-GPU-MODULE-SLIM",
    connector_type: "CPU-SOCKET-LGA-OMLS",
    connector_supports_power: true,
    connector_supports_data: true,
    removable: true,
    removal_method: "standard_screws",
    service_method: "STANDARD_TOOLS",
    requires_full_disassembly: false,
    interface_public: true,
    proprietary_interface: false,
    compatibility_generation_span: 2,
    physical_dimensions: {
      length_mm: 110,
      width_mm: 65,
      height_mm: 6
    },
    mounting_grid: "GRID-5MM",
    power_input: { min: 19, max: 20 },
    thermal_profile: 45,
    peak_load_watts: 65,
    firmware_version: "1.4.0",
    standard_identification_interface: true,
    identification_interface: "PCIe",
    plug_and_play_supported: true,
    brand_locking: false,
    compatibility_tags: ["LAPTOP-X", "GEN-12"],
    generation: 12,
    manufacturer_id: "MFG-OPEN-001",
    health_status: {
      thermal_degradation_score: 8
    },
    reusable_device_model_count: 3,
    scores: {
      repairability_score: 8,
      reusability_score: 9,
      openness_score: 10
    }
  },
  slot: {
    connector_type: "CPU-SOCKET-LGA-OMLS",
    power_output: { min: 18, max: 22 },
    mounting_grid: "GRID-5MM"
  },
  system: {
    motherboard: { supported_generation: 12 },
    compatibility_tags: ["GEN-12", "MOBILE", "LAPTOP-X"],
    cooling_system: {
      max_thermal_capacity: 65,
      enhanced_threshold: 55,
      enhanced_module_installed: true
    },
    total_system_power_draw_watts: 120,
    battery_power_limit_watts: 70,
    adapter_power_limit_watts: 80,
    minimum_score_threshold: 6,
    standard_mounting_grid: "GRID-5MM"
  }
};

const nonCompliantPayload = {
  omls: true,
  component: {
    component_id: "GPU-LOCK-999",
    component_type: "GPU",
    form_factor: "CUSTOM-GPU-BLOCK",
    connector_type: "PCIe-X16-CUSTOM",
    removable: false,
    removal_method: "glue",
    service_method: "PROPRIETARY_TOOL",
    requires_full_disassembly: true,
    interface_public: false,
    proprietary_interface: true,
    proprietary_locking_mechanism: true,
    connector_supports_power: true,
    connector_supports_data: false,
    power_input: { min: 19, max: 35 },
    thermal_profile: 120,
    firmware_version: "0.8.1",
    standard_identification_interface: false,
    plug_and_play_supported: false,
    brand_locking: true,
    compatibility_tags: ["VENDOR-Z-ONLY"],
    generation: 20,
    manufacturer_id: "MFG-LOCKED",
    health_status: {},
    reusable_device_model_count: 1,
    scores: {
      repairability_score: 2,
      reusability_score: 3,
      openness_score: 1
    }
  },
  slot: {
    connector_type: "PCIe-X16-STANDARD",
    power_output: { min: 10, max: 24 },
    mounting_grid: "GRID-5MM"
  },
  system: {
    motherboard: { supported_generation: 12 },
    compatibility_tags: ["GEN-12", "LAPTOP-X"],
    enforce_tag_intersection: true,
    cooling_system: {
      max_thermal_capacity: 80,
      enhanced_threshold: 60,
      enhanced_module_installed: false
    },
    total_system_power_draw_watts: 210,
    battery_power_limit_watts: 70,
    adapter_power_limit_watts: 120,
    minimum_score_threshold: 6,
    standard_mounting_grid: "GRID-5MM"
  }
};

console.log("=".repeat(70));
console.log("OMLS RULE ENGINE TESTS");
console.log("=".repeat(70));

console.log("\nTEST 1: COMPLIANT PAYLOAD");
const compliant = evaluateDevice(compliantPayload);
console.log("Model:", compliant.evaluationModel);
console.log("Overall:", compliant.overall);
console.log("Verdict:", compliant.omls?.result?.verdict);
console.log("Failures:", compliant.omls?.result?.failures?.length || 0);
console.log("Warnings:", compliant.omls?.result?.warnings?.length || 0);

console.log("\nTEST 2: NON-COMPLIANT PAYLOAD");
const nonCompliant = evaluateDevice(nonCompliantPayload);
console.log("Model:", nonCompliant.evaluationModel);
console.log("Overall:", nonCompliant.overall);
console.log("Verdict:", nonCompliant.omls?.result?.verdict);
console.log("Failures:", nonCompliant.omls?.result?.failures?.length || 0);
console.log("Warnings:", nonCompliant.omls?.result?.warnings?.length || 0);

console.log("\nTop failure reasons:");
(nonCompliant.omls?.result?.failures || []).slice(0, 8).forEach((failure) => {
  console.log(`- [${failure.ruleId}] ${failure.message}`);
});

console.log("\nCompleted OMLS tests.");
