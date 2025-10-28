#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
REGISTRY_PID_FILE="$LOG_DIR/registry-service.pid"

if [ -x "$SCRIPT_DIR/stop-isolated.sh" ]; then
  "$SCRIPT_DIR/stop-isolated.sh"
fi

if [ -f "$REGISTRY_PID_FILE" ]; then
  REGISTRY_PID=$(cat "$REGISTRY_PID_FILE")
  if ps -p "$REGISTRY_PID" >/dev/null 2>&1; then
    echo "Stopping registry-service (PID $REGISTRY_PID)"
    kill "$REGISTRY_PID"
  fi
  rm -f "$REGISTRY_PID_FILE"
fi

echo "AutoWRX stack with registry stopped"
