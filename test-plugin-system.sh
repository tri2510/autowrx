#!/bin/bash

# AutoWRX Plugin System Test Script
# Quick verification that everything is working

echo "🧪 AutoWRX Plugin System Test"
echo "============================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test 1: Check if backend is running
print_test "Checking backend server..."
if curl -s http://localhost:3200 > /dev/null; then
    print_pass "Backend is running on port 3200"
else
    print_fail "Backend not running. Run: ./start-autowrx.sh"
    exit 1
fi

# Test 2: Check if frontend is running
print_test "Checking frontend server..."
if curl -s http://localhost:3210 > /dev/null; then
    print_pass "Frontend is running on port 3210"
else
    print_fail "Frontend not running. Run: ./start-autowrx.sh"
    exit 1
fi

# Test 3: Check plugin files exist
print_test "Checking plugin files..."
PLUGIN_COUNT=0
for plugin in frontend/public/plugins/*/manifest.json; do
    if [ -f "$plugin" ]; then
        PLUGIN_NAME=$(basename $(dirname "$plugin"))
        print_pass "Plugin found: $PLUGIN_NAME"
        ((PLUGIN_COUNT++))
    fi
done

if [ $PLUGIN_COUNT -eq 0 ]; then
    print_fail "No plugins found"
    exit 1
else
    print_pass "$PLUGIN_COUNT plugins found"
fi

# Test 4: Check key files exist
print_test "Checking core files..."
CORE_FILES=(
    "frontend/src/core/plugin-manager.ts"
    "frontend/src/core/plugin-loader.ts" 
    "frontend/src/core/tab-manager.ts"
    "frontend/src/core/plugin-api.ts"
    "frontend/src/pages/PageModelDetail.tsx"
    "frontend/src/pages/PageModelList.tsx"
)

for file in "${CORE_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_pass "Core file exists: $(basename $file)"
    else
        print_fail "Missing core file: $file"
        exit 1
    fi
done

echo ""
echo "🎉 All Tests Passed!"
echo "==================="
echo ""
print_info "System Status: READY"
print_info "Backend:       http://localhost:3200"
print_info "Frontend:      http://localhost:3210"
echo ""
print_info "🎯 Main Demo URLs:"
echo "   • Vehicle Models:  http://localhost:3210/model"
echo "   • Model Detail:    http://localhost:3210/model/bmw-x3-2024"
echo "   • Plugin Demo:     http://localhost:3210/plugin-demo"
echo ""
print_info "🔌 Expected Plugin Tabs:"
echo "   • Built-in: Journey, Flow, SDV Code, Dashboard, Homologation"
echo "   • Plugins:  Test Tab, Vehicle Monitor, My First Tab"
echo ""
print_info "✅ The complete AutoWRX plugin system is ready for testing!"
echo ""