#!/usr/bin/env node

const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:3000");

ws.on("open", () => {
  console.log("✓ Connected to WebSocket server");
  console.log("Receiving live system metrics...\n");
});

ws.on("message", (data) => {
  try {
    const message = JSON.parse(data);
    if (message.type === "evaluation" || message.type === "update") {
      const report = message.data;
      const metrics = message.metrics;

      if (metrics) {
        console.log(`[${new Date(metrics.timestamp).toLocaleTimeString()}]`);
        console.log(`  CPU: ${metrics.cpu_usage}%`);
        console.log(`  RAM: ${metrics.ram_gb} GB`);
        console.log(`  Storage Health: ${metrics.storage_health}%`);
        console.log(`  Battery: ${metrics.battery_health}%`);
      }

      if (report) {
        console.log(`  Overall Health: ${report.overall.health} (Score: ${report.overall.total_score}/100)`);
      }
      console.log();
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
});

ws.on("error", (error) => {
  console.error("❌ WebSocket error:", error.message);
});

ws.on("close", () => {
  console.log("Disconnected from WebSocket server");
  process.exit(0);
});

// Auto-close after 30 seconds
setTimeout(() => {
  console.log("\nTest complete. Closing connection...");
  ws.close();
}, 30000);
