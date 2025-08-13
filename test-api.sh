#!/bin/bash

# Test script for Vertex AI Utilities API
# Make sure the server is running before executing this script

ACCESS_TOKEN="dev-access-token-12345"
BASE_URL="http://localhost:3000"

echo "Testing Vertex AI Utilities API..."
echo "================================="

# Test root endpoint
echo -e "\n1. Testing root endpoint:"
curl -s "$BASE_URL/"

# Test health endpoint
echo -e "\n\n2. Testing health endpoint:"
curl -s "$BASE_URL/health"

# Test docs json
echo -e "\n\n3. Testing docs JSON:"
curl -s "$BASE_URL/api/docs.json" | jq '.info.title, .openapi' 2>/dev/null || echo "(jq not installed)"

# Test Vertex AI health
echo -e "\n\n4. Testing Vertex AI health:"
curl -s "$BASE_URL/api/v1/vertex-ai/health" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Test Genkit health
echo -e "\n\n5. Testing Genkit health:"
curl -s "$BASE_URL/api/v1/genkit/health" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Test Media health
echo -e "\n\n6. Testing Media health:"
curl -s "$BASE_URL/api/v1/media/health" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Test text-to-image
echo -e "\n\n7. Testing text-to-image endpoint:"
curl -s -X POST "$BASE_URL/api/v1/vertex-ai/text2image" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "numImages": 1,
    "width": 1024,
    "height": 1024
  }'

# Test completion (non-streaming)
echo -e "\n\n8. Testing completion endpoint (non-streaming):"
curl -s -X POST "$BASE_URL/api/v1/genkit/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "prompt": "Hello, how are you?",
    "maxTokens": 100,
    "stream": false
  }'

# Test streaming completion
echo -e "\n\n9. Testing streaming completion endpoint:"
echo "Sending request to streaming endpoint..."
curl -N -X POST "$BASE_URL/api/v1/genkit/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "prompt": "Write a haiku about coding",
    "stream": true
  }'

# Test speech-to-text
echo -e "\n\n10. Testing speech-to-text (expected to depend on model support):"
curl -s -X POST "$BASE_URL/api/v1/media/speech-to-text" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "audio": "UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAA==",
    "encoding": "LINEAR16",
    "sampleRateHertz": 16000,
    "languageCode": "en-US"
  }'

# Test text-to-speech
echo -e "\n\n11. Testing text-to-speech:"
curl -s -X POST "$BASE_URL/api/v1/media/text-to-speech" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "text": "Hello from the API",
    "voice": { "languageCode": "en-US" },
    "audioConfig": { "audioEncoding": "MP3" }
  }'

echo -e "\n\nTests completed!"