@echo off
echo Starting Device Health Diagnostics...
echo.

REM Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell found. Running diagnostics...'" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PowerShell is not available on this system.
    echo Please install PowerShell or run the diagnostics.ps1 script manually.
    pause
    exit /b 1
)

REM Run the PowerShell diagnostics script
powershell -ExecutionPolicy Bypass -File "%~dp0diagnostics.ps1"

if %errorlevel% equ 0 (
    echo.
    echo Diagnostics completed successfully!
    echo You can now view the results in your browser at: http://localhost:5173/results
) else (
    echo.
    echo Diagnostics failed. Please check the error messages above.
)

echo.
echo Press any key to continue...
pause >nul
