#!/bin/bash

echo "🧪 Testing Complete Authentication Flow"
echo "======================================"

# Login and get token
echo "🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@autowrx.local","password":"AutoWRX2025!"}')

echo "📊 Login Response:"
echo "$LOGIN_RESPONSE" | jq .

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.access.token')
if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Token received: ${TOKEN:0:50}..."

# Test auth status
echo ""
echo "🔍 Testing auth status..."
STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3200/v2/auth/status)
echo "📊 Status Response:"
echo "$STATUS_RESPONSE" | jq .

# Test user self
echo ""
echo "👤 Testing user self..."
USER_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3200/v2/users/self)
echo "📊 User Response:"
echo "$USER_RESPONSE" | jq .

echo ""
echo "✅ Authentication test completed!"