#!/bin/bash

set -euo pipefail

API_BASE="${API_BASE:-__API_BASE__}"
if [[ "$API_BASE" == "__API_BASE__" ]]; then
  API_BASE="https://hardware-diagnostics.vercel.app"
fi
API_BASE="${API_BASE%/}"
SUBMIT_URL="$API_BASE/api/submit-diagnostics"
STATUS_URL="$API_BASE/api/status"

echo "Running diagnostics..."

if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl is required but not installed."
  exit 1
fi

CPU=$(top -bn1 | awk '/Cpu\(s\)/ {print int(100 - $8); found=1} END {if (!found) print 0}')
RAM_MB=$(free -m | awk '/Mem:/ {print $2}')
RAM_GB=$(( (RAM_MB + 1023) / 1024 ))
DISK_USED=$(df / | awk 'NR==2 {gsub("%", "", $5); print $5}')
STORAGE=$((100 - DISK_USED))

BATTERY=90
if compgen -G "/sys/class/power_supply/BAT*/capacity" > /dev/null; then
  BATTERY=$(cat /sys/class/power_supply/BAT*/capacity 2>/dev/null | head -n1)
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
HOSTNAME_VALUE=$(hostname)

echo "Checking backend at $API_BASE ..."
if ! curl -sS -m 5 "$STATUS_URL" >/dev/null; then
  echo "ERROR: Backend is not reachable at $API_BASE"
  echo "Set API_BASE and retry for a specific backend (example):"
  echo "API_BASE=https://hardware-diagnostics.vercel.app ./diagnostics.sh"
  exit 1
fi

JSON=$(cat <<EOF
{
  "cpu_usage": $CPU,
  "ram_gb": $RAM_GB,
  "storage_health": $STORAGE,
  "battery_health": $BATTERY,
  "motherboard": true,
  "timestamp": "$TIMESTAMP",
  "hostname": "$HOSTNAME_VALUE"
}
EOF
)

HTTP_CODE=$(curl -sS -o /tmp/diagnostics_response.json -w "%{http_code}" \
  -X POST "$SUBMIT_URL" \
  -H "Content-Type: application/json" \
  -d "$JSON")

if [[ "$HTTP_CODE" =~ ^2 ]]; then
  echo "Diagnostics sent successfully."
  echo "Response: $(cat /tmp/diagnostics_response.json)"
else
  echo "ERROR: Failed to submit diagnostics (HTTP $HTTP_CODE)."
  echo "Response: $(cat /tmp/diagnostics_response.json)"
  exit 1
fi
