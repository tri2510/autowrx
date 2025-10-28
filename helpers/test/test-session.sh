#!/bin/bash

echo "🎯 TESTING FIXED AUTHENTICATION SESSION"
echo "======================================="

COOKIE_JAR="/tmp/auth_test_cookies.jar"

echo "🔐 Step 1: Login with cookie persistence..."
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -X POST http://localhost:3200/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@autowrx.local","password":"AutoWRX2025!"}')

echo "✅ Login completed"

echo ""
echo "🍪 Step 2: Check cookies (should have both refresh and access tokens)..."
if [ -f "$COOKIE_JAR" ]; then
  cat "$COOKIE_JAR"
else
  echo "❌ No cookies saved"
fi

echo ""
echo "🔍 Step 3: Test authenticated endpoints with cookies..."

echo "📊 Auth Status:"
curl -s -b "$COOKIE_JAR" http://localhost:3200/v2/auth/status | jq .

echo ""
echo "👤 User Self:"
curl -s -b "$COOKIE_JAR" http://localhost:3200/v2/users/self | jq .

# Cleanup
rm -f "$COOKIE_JAR"

echo ""
echo "✅ TEST COMPLETE - Check if 'authenticated: true' appears above!"