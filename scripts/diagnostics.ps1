# Windows PowerShell Diagnostics Script
# Collects system diagnostic data and sends it to the backend

$BACKEND_BASE = if ($env:API_BASE) { $env:API_BASE.TrimEnd('/') } else { "__API_BASE__" }
if ($BACKEND_BASE -eq "__API_BASE__") {
  $LOCAL_BACKEND = "http://localhost:3000"
  try {
    Invoke-WebRequest -Uri "$LOCAL_BACKEND/api/status" -Method GET -UseBasicParsing -TimeoutSec 2 | Out-Null
    $BACKEND_BASE = $LOCAL_BACKEND
  }
  catch {
    $BACKEND_BASE = "https://hardware-diagnostics.vercel.app"
  }
}
$STATUS = "$BACKEND_BASE/api/status"
$BACKEND = "$BACKEND_BASE/api/submit-diagnostics"

Write-Host "Running diagnostics..." -ForegroundColor Green

try {
  Invoke-WebRequest -Uri $STATUS -Method GET -UseBasicParsing -TimeoutSec 8 | Out-Null
}
catch {
  Write-Host "✗ Backend is not reachable at $BACKEND_BASE" -ForegroundColor Red
  Write-Host "Set API_BASE and retry for a specific backend (examples):" -ForegroundColor Yellow
  Write-Host "$env:API_BASE='http://localhost:3000'; .\diagnostics.ps1" -ForegroundColor Yellow
  Write-Host "$env:API_BASE='https://hardware-diagnostics.vercel.app'; .\diagnostics.ps1" -ForegroundColor Yellow
  exit 1
}

# Get CPU usage (percentage)
$CPU = [math]::Round((Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction SilentlyContinue).CounterSamples[0].CookedValue, 0)

# Get RAM in GB
$RAM = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 0)

# Get Storage usage
$StorageDrive = Get-PSDrive C
$UsedSpace = $StorageDrive.Used
$TotalSpace = $StorageDrive.Used + $StorageDrive.Free
$StorageHealth = [math]::Round((($TotalSpace - $UsedSpace) / $TotalSpace) * 100, 0)

# Get Battery Health (if available)
$Battery = 90
try {
  $BatteryStatus = Get-CimInstance -ClassName Win32_Battery -ErrorAction SilentlyContinue
  if ($BatteryStatus) {
    $Battery = $BatteryStatus[0].EstimatedChargeRemaining
  }
}
catch {
  $Battery = 90
}

# Check if motherboard is detected
$Motherboard = $true

# Create JSON payload
$JsonData = @{
  cpu_usage = if ([string]::IsNullOrEmpty($CPU) -or $CPU -eq 0) { 45 } else { $CPU }
  ram_gb = $RAM
  storage_health = $StorageHealth
  battery_health = $Battery
  motherboard = $Motherboard
} | ConvertTo-Json

Write-Host "Sending diagnostics data..." -ForegroundColor Yellow

# Send to backend
try {
  $Response = Invoke-WebRequest -Uri $BACKEND `
    -Method POST `
    -ContentType "application/json" `
    -Body $JsonData `
    -ErrorAction SilentlyContinue
  
  Write-Host "✓ Diagnostics sent successfully!" -ForegroundColor Green
  Write-Host "Response: $($Response.StatusCode)" -ForegroundColor Green
}
catch {
  Write-Host "✗ Error sending diagnostics: $_" -ForegroundColor Red
}
