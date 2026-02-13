# Hardware Reusability Evaluation System - Integration Guide

## Overview

Your application now implements a **professional-grade standardized hardware reusability scoring model** that follows industry best practices. The system evaluates hardware on a 0-100 scale with four weighted categories.

## Architecture

### Two Evaluation Modes

The system automatically detects which evaluation mode to use based on input data:

#### 1. **Legacy Mode** (Simple Metrics)
Used when input contains basic component metrics:
- CPU usage (%)
- RAM capacity (GB)
- Storage health (%)
- Battery health (%)

**Files:**
- Backend: `/backend/services/evaluateDevice.js`
- Rules: `/backend/rules/healthRules.js`

#### 2. **Standardized Mode** (Comprehensive Diagnostics)
Used when input contains detailed hardware diagnostic data from professional tools.

**Files:**
- Backend: `/backend/services/evaluateDevice.js` (auto-detection logic)
- Rules: `/backend/rules/healthRules.js` (standardized scoring functions)
- Frontend: `/frontend/rules/healthRules.js` (classification display)

---

## Standardized Scoring Model

### Four Evaluation Categories (Total: 100 points)

#### 1. **Functional Integrity** (40 points)
Tests component stability and reliability:
- **Storage** (10 pts): SMART status, reallocated sectors
- **RAM** (10 pts): MemTest86 error detection
- **CPU** (10 pts): Prime95 stress test stability
- **GPU** (10 pts): FurMark/3DMark artifacts

#### 2. **Performance Retention** (30 points)
Measured performance vs. reference benchmark:
- 95-100%: 30 pts (Excellent)
- 90-94%: 25 pts (Very Good)
- 85-89%: 20 pts (Good)
- 80-84%: 15 pts (Acceptable)
- <80%: 5 pts (Poor)

#### 3. **Remaining Life / Wear Level** (20 points)
Lifespan and degradation assessment:
- **SSD Wear** (10 pts): TBW usage percentage
- **Battery Health** (10 pts): Charge cycles and capacity

#### 4. **Physical & Thermal Condition** (10 points)
Physical state and temperature management:
- Physical damage assessment
- Port/connector integrity
- Idle & load temperatures

---

## Reusability Classification

| Score | Tier | Classification | Recommendation |
|-------|------|---|---|
| 85-100 | 🟢 High-Grade | Excellent condition, ready for immediate reuse | Enterprise deployment |
| 70-84 | 🔵 Reusable | Good condition, minor upgrades recommended | Standard deployment |
| 50-69 | 🟡 Limited | Functional but with notable limitations | Non-critical apps |
| <50 | 🔴 Not Recommended | Significant issues present | Do not reuse |

---

## Backend Implementation

### Main Evaluation Function
Location: `/backend/services/evaluateDevice.js`

```javascript
// Automatically detects input format
const result = evaluateDevice({
  // Legacy format
  cpu: 65,
  ram: 8,
  storage: 75,
  battery: 80
});

// OR Standardized format
const result = evaluateDevice({
  storage_smart_status: "GOOD",
  ram_test_errors: 0,
  cpu_stress_stable: true,
  performance_percentage: 95,
  ssd_wear_percentage: 20,
  battery_health_percent: 85,
  physical_damage: false,
  port_integrity: true,
  idle_temperature_celsius: 35,
  load_temperature_celsius: 72
});
```

### Standardized Input Format

**Functional Integrity:**
- `storage_smart_status`: "GOOD" | "WARNING" | "FAILED"
- `ram_test_errors`: number (0 = pass)
- `cpu_stress_stable`: boolean
- `cpu_throttling`: boolean
- `gpu_stress_stable`: boolean
- `gpu_artifacts`: boolean

**Performance Retention:**
- `performance_percentage`: 0-100 (vs. reference)

**Remaining Life:**
- `ssd_wear_percentage`: 0-100
- `battery_health_percent`: 0-100

**Physical & Thermal:**
- `physical_damage`: boolean
- `port_integrity`: boolean
- `idle_temperature_celsius`: number
- `load_temperature_celsius`: number

### Response Format

**Standardized Evaluation Response:**
```javascript
{
  evaluationModel: "STANDARDIZED_HARDWARE_REUSABILITY",
  standardized: {
    totalScore: 92,
    classification: {
      level: "High-grade reusable",
      description: "Excellent condition, ready for immediate reuse",
      tier: "HIGH_GRADE"
    },
    categories: {
      functionalIntegrity: {
        score: 38,
        maxScore: 40,
        percentage: 95,
        details: { /* component details */ }
      },
      performanceRetention: {
        score: 28,
        maxScore: 30,
        percentage: 93,
        details: { /* benchmark data */ }
      },
      remainingLife: {
        score: 19,
        maxScore: 20,
        percentage: 95,
        details: { /* wear data */ }
      },
      physicalThermal: {
        score: 9,
        maxScore: 10,
        percentage: 90,
        details: { /* condition data */ }
      }
    },
    summary: "Hardware Reusability Score: 92/100 | Classification: High-grade reusable | ...",
    calculations: {
      functionalIntegrity: "38/40",
      performanceRetention: "28/30",
      remainingLife: "19/20",
      physicalThermal: "9/10",
      total: "92/100"
    },
    recommendedActions: [
      {
        priority: "LOW",
        action: "READY FOR REUSE",
        description: "Hardware is in excellent condition and ready for immediate refurbishment and reuse."
      }
    ]
  },
  overall: {
    health: "GOOD",
    total_score: 92,
    reusable: true,
    classification: "High-grade reusable"
  }
}
```

---

## Frontend Implementation

### Classification Display
Location: `/frontend/rules/healthRules.js`

Use the `classifyByStandardized()` function to get UI-ready classification:

```javascript
const healthRules = require('./rules/healthRules');
const classification = healthRules.classifyByStandardized(92);

// Returns:
{
  badge: "✓ Excellent",
  color: "#10b981",
  label: "High-grade reusable",
  description: "Excellent condition, ready for immediate reuse",
  tier: "HIGH_GRADE"
}
```

### Reusability Badge Component

Available tiers in `REUSABILITY_TIERS`:
- `HIGH_GRADE`: ✓ Excellent (Green)
- `REUSABLE`: Good (Blue)
- `LIMITED`: Limited (Amber)
- `NOT_RECOMMENDED`: ⚠ Not Recommended (Red)

---

## Test Suite

Location: `/backend/testStandardizedEvaluation.js`

Run tests to validate both input formats:

```bash
node backend/testStandardizedEvaluation.js
```

**Test Coverage:**
- ✓ Legacy input format evaluation
- ✓ High-grade hardware (100/100)
- ✓ Reusable hardware (84/100)
- ✓ Limited reuse hardware (48-69 range)
- ✓ Not recommended hardware (<50)

---

## API Integration

### Option 1: Direct HTTP Endpoint
If you have a POST endpoint, send standardized diagnostics:

```bash
POST /api/evaluate
Content-Type: application/json

{
  "storage_smart_status": "GOOD",
  "ram_test_errors": 0,
  "cpu_stress_stable": true,
  "performance_percentage": 92,
  "ssd_wear_percentage": 25,
  "battery_health_percent": 88,
  "physical_damage": false,
  "port_integrity": true,
  "idle_temperature_celsius": 38,
  "load_temperature_celsius": 75
}
```

### Option 2: WebSocket Real-Time Monitoring
Extend your existing WebSocket to include standardized diagnostics:

```javascript
ws.on('message', (data) => {
  const metrics = JSON.parse(data);
  const evaluation = evaluateDevice(metrics); // Auto-detects format
  broadcastEvaluation(evaluation);
});
```

---

## Professional Evaluation Report

To generate a professional report, use the response structure:

```javascript
const { standardized } = result;

const report = `
HARDWARE REUSABILITY EVALUATION REPORT
======================================
Device Score: ${standardized.totalScore}/100
Classification: ${standardized.classification.level}

Category Breakdown:
- Functional Integrity:  ${standardized.categories.functionalIntegrity.score}/${standardized.categories.functionalIntegrity.maxScore}
- Performance Retention: ${standardized.categories.performanceRetention.score}/${standardized.categories.performanceRetention.maxScore}
- Remaining Life:        ${standardized.categories.remainingLife.score}/${standardized.categories.remainingLife.maxScore}
- Physical & Thermal:    ${standardized.categories.physicalThermal.score}/${standardized.categories.physicalThermal.maxScore}

Recommendations:
${standardized.recommendedActions.map(a => `[${a.priority}] ${a.action}: ${a.description}`).join('\n')}
`;
```

---

## Key Features

✅ **Industry-Aligned**: Based on professional hardware refurbishment standards
✅ **Comprehensive**: 4 evaluation categories, 40+ diagnostic parameters
✅ **Transparent**: Shows detailed calculations for each category
✅ **Actionable**: Priority-based recommendations for upgrades/maintenance
✅ **Backward Compatible**: Supports both legacy and standardized inputs
✅ **Professional Output**: Suitable for enterprise refurbishment workflows

---

## Next Steps

1. **Integrate diagnostic tools**: Connect SMART readers, MemTest86, benchmarks
2. **Update UI**: Display standardized scores with color-coded classifications
3. **Generate reports**: Create PDF/print-friendly evaluation reports
4. **Set thresholds**: Define your own acceptance criteria per tier
5. **Track metrics**: Store evaluations for historical analysis

---

## Support & Customization

The scoring model parameters are configurable:

**Backend:** `/backend/rules/healthRules.js`
- `SCORING_CATEGORIES`: Adjust point allocations
- `REUSABILITY_CLASSIFICATION`: Modify score thresholds
- `scoreXxx()` functions: Customize evaluation logic

**Frontend:** `/frontend/rules/healthRules.js`
- `REUSABILITY_TIERS`: Customize badges and colors
- `classifyByStandardized()`: Custom classification logic

---

For production deployment, ensure:
1. Diagnostic tools are properly calibrated
2. Reference benchmarks are current for your hardware models
3. Temperature limits match manufacturer specs
4. Wear percentage calculations use actual device data

