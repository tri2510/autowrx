#!/bin/bash

echo "🧪 Testing AutoWRX Isolated Environment Login"
echo "==========================================="

# Test login with proper JSON formatting
echo "🔐 Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@autowrx.local","password":"AutoWRX2025!"}')

echo "📊 Login response:"
echo "$LOGIN_RESPONSE" | jq .

# Extract token if login successful
if echo "$LOGIN_RESPONSE" | jq -e '.tokens.access.token' > /dev/null; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.access.token')
  echo "✅ Login successful! Token: ${TOKEN:0:20}..."
  
  # Test authenticated endpoint
  echo "🔒 Testing authenticated endpoint..."
  USER_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3200/v2/users/self)
  echo "👤 User info:"
  echo "$USER_RESPONSE" | jq .
  
  # Test permissions
  echo "🛡️ Testing permissions..."
  PERM_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "http://localhost:3200/v2/permissions/has-permission?permissions=manageUsers")
  echo "🔑 Permissions:"
  echo "$PERM_RESPONSE" | jq .
  
else
  echo "❌ Login failed"
fi