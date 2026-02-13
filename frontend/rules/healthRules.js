/**
 * Frontend Health Rules - Standardized Hardware Reusability Model
 * Optimized for fast classification and UI rendering
 */

// Standardized Reusability Classification (efficient lookup structure)
const REUSABILITY_TIERS = {
  HIGH_GRADE: {
    score: { min: 85, max: 100 },
    label: "High-grade reusable",
    description: "Excellent condition, ready for immediate reuse",
    badge: "✓ Excellent",
    color: "#10b981"
  },
  REUSABLE: {
    score: { min: 70, max: 84 },
    label: "Reusable",
    description: "Good condition, minor upgrades recommended",
    badge: "Good",
    color: "#3b82f6"
  },
  LIMITED: {
    score: { min: 50, max: 69 },
    label: "Limited reuse",
    description: "Functional but with notable limitations",
    badge: "Limited",
    color: "#f59e0b"
  },
  NOT_RECOMMENDED: {
    score: { min: 0, max: 49 },
    label: "Not recommended",
    description: "Significant issues present, reuse not advised",
    badge: "⚠ Not Recommended",
    color: "#ef4444"
  }
};

// Legacy component scoring (unchanged for backward compatibility)
const componentScores = {
  cpu: [{ min: 80, health: "GOOD", score: 25 }, { min: 50, health: "FAIR", score: 15 }, { min: 0, health: "POOR", score: 5 }],
  ram: [{ min: 16, health: "GOOD", score: 20 }, { min: 8, health: "FAIR", score: 12 }, { min: 0, health: "POOR", score: 5 }],
  storage: [{ min: 80, health: "GOOD", score: 30 }, { min: 50, health: "FAIR", score: 15 }, { min: 0, health: "POOR", score: 5 }],
  battery: [{ min: 80, health: "GOOD", score: 15 }, { min: 40, health: "FAIR", score: 8 }, { min: 0, health: "POOR", score: 3 }]
};

// Standardized category weights
const STANDARD_WEIGHTS = {
  functionalIntegrity: 40,
  performanceRetention: 30,
  remainingLife: 20,
  physicalThermal: 10
};

/**
 * Fast classification using sorted tier lookup
 */
const SORTED_TIERS = Object.values(REUSABILITY_TIERS).sort((a, b) => b.score.min - a.score.min);

/**
 * Classify reusability with early exit (O(n) worst case, typically O(1))
 */
function classifyByStandardized(score) {
  for (const tier of SORTED_TIERS) {
    if (score >= tier.score.min) return tier;
  }
  return REUSABILITY_TIERS.NOT_RECOMMENDED;
}

/**
 * Get visual badge info from score
 */
function getReusabilityBadge(score) {
  const tier = classifyByStandardized(score);
  const tierKey = Object.keys(REUSABILITY_TIERS).find(key => REUSABILITY_TIERS[key] === tier);
  return {
    badge: tier.badge,
    color: tier.color,
    label: tier.label,
    description: tier.description,
    tier: tierKey
  };
}

module.exports = {
  // Legacy exports
  cpu: componentScores.cpu,
  ram: componentScores.ram,
  storage: componentScores.storage,
  battery: componentScores.battery,

  // Standardized model exports
  REUSABILITY_TIERS,
  STANDARD_WEIGHTS,
  classifyByStandardized,
  getReusabilityBadge
};
