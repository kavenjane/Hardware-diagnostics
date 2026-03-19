#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="$SCRIPT_DIR/diagnostics.sh"
BACKEND_URL="http://localhost:3000/api/status"
FRONTEND_URL="http://localhost:5173/"

if [ -d "$SCRIPT_DIR/../backend" ] && [ -d "$SCRIPT_DIR/../frontend" ]; then
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
elif [ -d "$SCRIPT_DIR/backend" ] && [ -d "$SCRIPT_DIR/frontend" ]; then
    PROJECT_ROOT="$SCRIPT_DIR"
else
    PROJECT_ROOT=""
fi

LOG_DIR="$SCRIPT_DIR/.logs"

mkdir -p "$LOG_DIR"

validate_diagnostics_script() {
    local firstLine
    firstLine="$(head -n 1 "$SCRIPT_PATH" 2>/dev/null || true)"

    if echo "$firstLine" | grep -qi "<!doctype html>"; then
        echo "ERROR: diagnostics.sh appears to be an HTML page, not a shell script."
        echo "Please re-download diagnostics.sh from the app and ensure file contents start with #!/bin/bash"
        return 1
    fi

    if ! echo "$firstLine" | grep -q "^#!"; then
        echo "ERROR: diagnostics.sh is not a valid executable script (missing shebang)."
        return 1
    fi

    return 0
}

wait_for_url() {
    local url="$1"
    local name="$2"
    local retries=30

    for ((i=1; i<=retries; i++)); do
        if curl -sS -m 2 "$url" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
    done

    echo "ERROR: $name did not become ready in time."
    return 1
}

start_backend_if_needed() {
    if curl -sS -m 2 "$BACKEND_URL" >/dev/null 2>&1; then
        echo "✓ Backend already running"
        return 0
    fi

    if [ -z "$PROJECT_ROOT" ]; then
        echo "ERROR: Backend is not running and project root was not detected for auto-start."
        echo "Run backend manually: cd /path/to/project/backend && npm start"
        return 1
    fi

    echo "Starting backend..."
    (
        cd "$PROJECT_ROOT/backend" || exit 1
        npm start > "$LOG_DIR/backend.log" 2>&1
    ) &

    wait_for_url "$BACKEND_URL" "Backend" || return 1
    echo "✓ Backend started"
}

start_frontend_if_needed() {
    if curl -sS -m 2 "$FRONTEND_URL" >/dev/null 2>&1; then
        echo "✓ Frontend already running"
        return 0
    fi

    if [ -z "$PROJECT_ROOT" ]; then
        echo "ERROR: Frontend is not running and project root was not detected for auto-start."
        echo "Run frontend manually: cd /path/to/project/frontend && npm run dev"
        return 1
    fi

    echo "Starting frontend..."
    (
        cd "$PROJECT_ROOT/frontend" || exit 1
        npm start > "$LOG_DIR/frontend.log" 2>&1
    ) &

    wait_for_url "$FRONTEND_URL" "Frontend" || return 1
    echo "✓ Frontend started"
}

echo "Device Health Diagnostics Launcher"
echo "=================================="
echo

# Check if the diagnostics script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "ERROR: diagnostics.sh not found in the same directory as this launcher."
    echo "Please ensure both files are in the same folder."
    exit 1
fi

validate_diagnostics_script || exit 1

# Make the script executable
echo "Making diagnostics script executable..."
chmod +x "$SCRIPT_PATH"

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to make script executable. Please run: chmod +x diagnostics.sh"
    exit 1
fi

# Ensure backend/frontend are running
start_backend_if_needed || exit 1
start_frontend_if_needed || exit 1

echo "Running diagnostics..."
echo

# Run the diagnostics script
"$SCRIPT_PATH"

if [ $? -eq 0 ]; then
    echo
    echo "✓ Diagnostics completed successfully!"
    echo "You can now view the results in your browser at: http://localhost:5173/results"
    echo "Logs (if auto-started): $LOG_DIR/backend.log and $LOG_DIR/frontend.log"
    echo
    echo "Press Enter to continue..."
    read -r
else
    echo
    echo "✗ Diagnostics failed. Please check the error messages above."
    echo
    echo "Press Enter to continue..."
    read -r
fi