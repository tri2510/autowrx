#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
REGISTRY_DIR="$SCRIPT_DIR/registry-service"
REGISTRY_PID_FILE="$LOG_DIR/registry-service.pid"
REGISTRY_LOG_FILE="$LOG_DIR/registry-service.log"

mkdir -p "$LOG_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Install Node.js/npm before running the stack." >&2
  exit 1
fi

if [ ! -d "$REGISTRY_DIR" ]; then
  echo "registry-service directory not found. Ensure the repository is on the feature branch." >&2
  exit 1
fi

kill_port() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids=$(lsof -ti ":$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      echo "Port $port in use by PID(s): $pids — terminating."
      for pid in $pids; do
        kill "$pid" 2>/dev/null || true
      done
      sleep 1
    fi
  fi
}

if [ -f "$REGISTRY_PID_FILE" ]; then
  if ps -p "$(cat "$REGISTRY_PID_FILE")" >/dev/null 2>&1; then
    echo "Stopping existing registry-service (PID $(cat "$REGISTRY_PID_FILE"))"
    kill "$(cat "$REGISTRY_PID_FILE")"
    sleep 1
  fi
  rm -f "$REGISTRY_PID_FILE"
fi

kill_port() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids=$(lsof -ti ":$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      echo "Port $port in use by PID(s): $pids — terminating."
      for pid in $pids; do
        kill "$pid" 2>/dev/null || true
      done
      sleep 1
    fi
  fi
}

kill_port 4400

if [ ! -d "$REGISTRY_DIR/node_modules" ]; then
  echo "Installing registry-service dependencies..."
  (cd "$REGISTRY_DIR" && npm install)
fi

REGISTRY_STARTED=0

stop_registry() {
  if [ "$REGISTRY_STARTED" -eq 1 ] && [ -f "$REGISTRY_PID_FILE" ]; then
    local REGISTRY_PID=$(cat "$REGISTRY_PID_FILE")
    if ps -p "$REGISTRY_PID" >/dev/null 2>&1; then
      echo "Stopping registry-service (PID $REGISTRY_PID)"
      kill "$REGISTRY_PID" 2>/dev/null || true
      wait "$REGISTRY_PID" 2>/dev/null || true
    fi
    rm -f "$REGISTRY_PID_FILE"
  fi
}

trap stop_registry EXIT

echo "Starting registry-service on http://localhost:4400"
(cd "$REGISTRY_DIR" && npm run dev >"$REGISTRY_LOG_FILE" 2>&1 &)
REGISTRY_PID=$!
REGISTRY_STARTED=1
echo $REGISTRY_PID > "$REGISTRY_PID_FILE"

sleep 1
if ! ps -p "$REGISTRY_PID" >/dev/null 2>&1; then
  REGISTRY_PID=$(pgrep -f "registry-service/src/app.js" | head -n 1 || true)
  if [ -n "$REGISTRY_PID" ]; then
    echo $REGISTRY_PID > "$REGISTRY_PID_FILE"
  fi
fi

echo "Registry service PID: ${REGISTRY_PID:-unknown} (logs: $REGISTRY_LOG_FILE)"

if [ -z "$REGISTRY_PID" ] || ! ps -p "$REGISTRY_PID" >/dev/null 2>&1; then
  echo "Registry service failed to start; see $REGISTRY_LOG_FILE" >&2
  tail -n 40 "$REGISTRY_LOG_FILE" >&2 || true
  exit 1
fi

export EXTENSION_REGISTRY_URL="${EXTENSION_REGISTRY_URL:-http://localhost:4400}"

echo "EXTENSION_REGISTRY_URL set to $EXTENSION_REGISTRY_URL"

if [ ! -x "$SCRIPT_DIR/start-isolated.sh" ]; then
  echo "start-isolated.sh not found or not executable. Please launch backend/frontend manually." >&2
  exit 0
fi

echo "Launching AutoWRX isolated stack..."
kill_port 3200
kill_port 3210
if ! EXTENSION_REGISTRY_URL="$EXTENSION_REGISTRY_URL" "$SCRIPT_DIR/start-isolated.sh"; then
  echo "AutoWRX isolated stack failed to start." >&2
  if [ -f "$SCRIPT_DIR/logs/backend-isolated.log" ]; then
    echo "---- backend-isolated.log (tail) ----" >&2
    tail -n 40 "$SCRIPT_DIR/logs/backend-isolated.log" >&2
    echo "-------------------------------------" >&2
  fi
  exit 1
fi
