#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REGISTRY_DIR="$REPO_ROOT/registry-service"
LOG_DIR="$REPO_ROOT/logs"

mkdir -p "$LOG_DIR"

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
(cd "$REGISTRY_DIR" && npm run dev)
