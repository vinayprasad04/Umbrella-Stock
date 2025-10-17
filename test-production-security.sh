#!/bin/bash

# Test Production Security
# This script tests if origin validation is working correctly

PROD_URL="https://umbrella-stock.vercel.app/api/auth/login"
EMAIL="vinay.qss@gmail.com"
PASSWORD="654321"

echo "================================"
echo "Testing Production Security"
echo "================================"
echo ""

# Test 1: Without Origin (should FAIL)
echo "Test 1: Request WITHOUT Origin header"
echo "Expected: 403 Forbidden"
echo "-------------------------------"
RESPONSE1=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$PROD_URL" \
  -H 'Content-Type: application/json' \
  --data-raw "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

HTTP_CODE1=$(echo "$RESPONSE1" | grep "HTTP_CODE:" | cut -d: -f2)
BODY1=$(echo "$RESPONSE1" | sed '/HTTP_CODE:/d')

echo "Response Code: $HTTP_CODE1"
echo "Response Body: $BODY1"
echo ""

if [ "$HTTP_CODE1" = "403" ]; then
  echo "✅ PASS - Security is working! Request blocked without Origin."
else
  echo "❌ FAIL - Security NOT working! Request should be blocked."
fi

echo ""
echo "================================"
echo ""

# Test 2: With Origin (should WORK)
echo "Test 2: Request WITH Origin header"
echo "Expected: 200 OK (or 401 if password wrong)"
echo "-------------------------------"
RESPONSE2=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$PROD_URL" \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://umbrella-stock.vercel.app' \
  --data-raw "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

HTTP_CODE2=$(echo "$RESPONSE2" | grep "HTTP_CODE:" | cut -d: -f2)
BODY2=$(echo "$RESPONSE2" | sed '/HTTP_CODE:/d')

echo "Response Code: $HTTP_CODE2"
echo "Response Body: $BODY2" | head -c 200
echo "..."
echo ""

if [ "$HTTP_CODE2" = "200" ] || [ "$HTTP_CODE2" = "401" ]; then
  echo "✅ PASS - Security is working! Request processed with valid Origin."
else
  echo "❌ FAIL - Unexpected response code."
fi

echo ""
echo "================================"
echo "SUMMARY"
echo "================================"
echo ""

if [ "$HTTP_CODE1" = "403" ] && ([ "$HTTP_CODE2" = "200" ] || [ "$HTTP_CODE2" = "401" ]); then
  echo "✅✅✅ ALL TESTS PASSED ✅✅✅"
  echo ""
  echo "Your production security is working correctly!"
  echo "- Blocks requests without Origin header"
  echo "- Allows requests with valid Origin header"
  echo ""
  echo "This means:"
  echo "  ✓ Postman WITHOUT Origin header will be blocked"
  echo "  ✓ Postman WITH Origin header will work"
  echo "  ✓ Browser requests will work (auto-sends Origin)"
  echo "  ✓ Attackers cannot access your API without Origin"
else
  echo "❌ SOME TESTS FAILED"
  echo ""
  echo "Security may not be configured correctly."
  echo "Check that NODE_ENV=production is set on Vercel."
fi

echo ""
echo "================================"
