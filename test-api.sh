#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000}
ACCESS_TOKEN=${ACCESS_TOKEN:-""}
ADMIN_KEY=${ADMIN_KEY:-""}

# Helper
call_api() {
  local method=$1
  local path=$2
  local data=${3:-}
  if [ -n "$data" ]; then
    curl -sS -X "$method" "$BASE_URL$path" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "X-Admin-Key: $ADMIN_KEY" \
      -d "$data"
  } else
    curl -sS -X "$method" "$BASE_URL$path" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "X-Admin-Key: $ADMIN_KEY"
  fi
}

# Test root endpoint
echo -e "\n1. Testing root endpoint:"
curl -s "$BASE_URL/"

# Test health endpoint
echo -e "\n\n2. Testing health endpoint:"
curl -s "$BASE_URL/health"

# Test docs json
echo -e "\n\n3. Testing docs JSON:"
curl -s "$BASE_URL/api/docs.json" | jq '.info.title, .openapi' 2>/dev/null || echo "(jq not installed)"

# --- Auth flows ---
# 1) Request token
REQ=$(call_api POST "/api/v1/auth/request" '{"email":"user@example.com","apis":["genkit","media"]}')
echo "$REQ"
REQ_ID=$(echo "$REQ" | jq -r '.data.request._id // .data.request.id // empty')

# 2) List pending requests (admin)
call_api GET "/api/v1/auth/requests?status=pending" | jq '.'

# 3) Approve request (admin)
if [ -n "$REQ_ID" ]; then
  APPROVE=$(call_api POST "/api/v1/auth/approve" "{\"requestId\":\"$REQ_ID\"}")
  echo "$APPROVE" | jq '.'
  ACCESS_TOKEN=$(echo "$APPROVE" | jq -r '.data.accessToken // empty')
  REFRESH_TOKEN=$(echo "$APPROVE" | jq -r '.data.refreshToken // empty')
  echo "Issued access token: ${ACCESS_TOKEN:0:32}..."
  echo "Issued refresh token: ${REFRESH_TOKEN:0:16}..."
fi

# Token details
echo -e "\n\n4. Token details:"
call_api GET "/api/v1/auth/token" | jq '.'

# Usage logs (current user)
echo -e "\n\n5. Usage logs:"
call_api GET "/api/v1/auth/usage?limit=5" | jq '.'

echo -e "\n\nTests completed!"