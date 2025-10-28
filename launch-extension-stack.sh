#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_LOG_DIR="$SCRIPT_DIR/logs"
STACK_PID_FILE="$STACK_LOG_DIR/extension-stack.pid"

mkdir -p "$STACK_LOG_DIR"

STACK_PID=0
cleanup() {
  if [ $STACK_PID -ne 0 ]; then
    if ps -p "$STACK_PID" >/dev/null 2>&1; then
      echo "Stopping AutoWRX stack (PID $STACK_PID)"
      kill "$STACK_PID" 2>/dev/null || true
      wait "$STACK_PID" 2>/dev/null || true
    fi
    STACK_PID=0
  fi
}

trap cleanup EXIT

if [ ! -x "$SCRIPT_DIR/start-autowrx-with-registry.sh" ]; then
  echo "start-autowrx-with-registry.sh not found or not executable." >&2
  echo "Please run this script from the repository root on the feature branch." >&2
  exit 1
fi

if [ -f "$STACK_PID_FILE" ]; then
  if ps -p "$(cat "$STACK_PID_FILE")" >/dev/null 2>&1; then
    echo "Existing stack detected (PID $(cat "$STACK_PID_FILE")) — stopping it first."
    kill "$(cat "$STACK_PID_FILE")" 2>/dev/null || true
    sleep 1
  fi
  rm -f "$STACK_PID_FILE"
fi

echo "Launching registry + AutoWRX stack..."
"$SCRIPT_DIR/start-autowrx-with-registry.sh" &
STACK_PID=$!
echo $STACK_PID > "$STACK_PID_FILE"

echo "Stack launcher PID: $STACK_PID"

wait_for_url() {
  local url=$1
  local timeout=${2:-120}
  local start=$(date +%s)
  while true; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    local now=$(date +%s)
    if [ $((now - start)) -ge $timeout ]; then
      echo "Timeout waiting for $url" >&2
      return 1
    fi
    sleep 2
  done
}

BACKEND_HEALTH_URL="http://localhost:3200/healthz"
FRONTEND_URL="http://localhost:3210"

echo "Waiting for backend ($BACKEND_HEALTH_URL)..."
if ! wait_for_url "$BACKEND_HEALTH_URL" 120; then
  echo "Backend did not become healthy. Check logs/backend-isolated.log." >&2
  exit 1
fi

# Wait for frontend by pinging root (may redirect)
echo "Waiting for frontend ($FRONTEND_URL)..."
if ! wait_for_url "$FRONTEND_URL" 120; then
  echo "Frontend did not start. Check logs/frontend-isolated.log." >&2
  exit 1
fi

open_browser() {
  local url=$1
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 || true
  elif command -v start >/dev/null 2>&1; then
    start "" "$url" >/dev/null 2>&1 || true
  else
    echo "Open your browser to: $url"
  fi
}

TARGET_PAGE="$FRONTEND_URL/model/bmw-x3-2024"
echo "Opening $TARGET_PAGE"
open_browser "$TARGET_PAGE"

echo "Stack is running. Press Ctrl+C to stop. Logs are in the logs/ directory."

wait "$STACK_PID"
STACK_PID=0
