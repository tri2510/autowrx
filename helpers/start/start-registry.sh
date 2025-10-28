#!/usr/bin/env bash

set -e

SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SELF_DIR/../.." && pwd)"
REGISTRY_DIR="$REPO_ROOT/registry-service"
LOG_DIR="$REPO_ROOT/logs"
REGISTRY_PID_FILE="$LOG_DIR/registry-service.pid"
REGISTRY_LOG_FILE="$LOG_DIR/registry-service.log"

source "$REPO_ROOT/helpers/common.sh"

cd "$REPO_ROOT"

mkdir -p "$LOG_DIR"

print_status "Preparing registry service..."

if [ -f "$REGISTRY_PID_FILE" ]; then
  REGISTRY_PID=$(cat "$REGISTRY_PID_FILE")
  if ps -p "$REGISTRY_PID" >/dev/null 2>&1; then
    print_status "Stopping existing registry-service (PID $REGISTRY_PID)"
    kill "$REGISTRY_PID" 2>/dev/null || true
    wait "$REGISTRY_PID" 2>/dev/null || true
  fi
  rm -f "$REGISTRY_PID_FILE"
fi

kill_port 4400

print_status "Cleanup complete. Starting registry-service..."

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Please install Node.js/npm before running the registry service." >&2
  exit 1
fi

if [ ! -d "$REGISTRY_DIR" ]; then
  echo "registry-service directory not found at: $REGISTRY_DIR" >&2
  echo "Ensure you're on the feature/extension-registry-prototype branch." >&2
  exit 1
fi

if [ ! -d "$REGISTRY_DIR/node_modules" ]; then
  echo "Installing registry-service dependencies..."
  (cd "$REGISTRY_DIR" && npm install)
fi

echo "Starting AutoWRX Extension Registry on http://localhost:4400"
(cd "$REGISTRY_DIR" && npm run dev >"$REGISTRY_LOG_FILE" 2>&1 &)
REGISTRY_PID=$!
echo $REGISTRY_PID > "$REGISTRY_PID_FILE"
print_success "Registry-service PID: $REGISTRY_PID (logs: $REGISTRY_LOG_FILE)"

trap 'if [ -f "$REGISTRY_PID_FILE" ]; then
  REGISTRY_PID=$(cat "$REGISTRY_PID_FILE")
  if ps -p "$REGISTRY_PID" >/dev/null 2>&1; then
    print_status "Stopping registry-service (PID $REGISTRY_PID)"
    kill "$REGISTRY_PID" 2>/dev/null || true
    wait "$REGISTRY_PID" 2>/dev/null || true
  fi
  rm -f "$REGISTRY_PID_FILE"
fi' EXIT

wait "$REGISTRY_PID"

