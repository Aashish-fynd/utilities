#!/bin/bash

# Test script for Vertex AI Utilities API
# Make sure the server is running before executing this script

API_KEY="dev-api-key-12345"
BASE_URL="http://localhost:3000"

echo "Testing Vertex AI Utilities API..."
echo "================================="

# Test root endpoint
echo -e "\n1. Testing root endpoint:"
curl -s "$BASE_URL/"

# Test health endpoint
echo -e "\n\n2. Testing health endpoint:"
curl -s "$BASE_URL/health"

# Test Vertex AI health
echo -e "\n\n3. Testing Vertex AI health:"
curl -s "$BASE_URL/api/v1/vertex-ai/health" \
  -H "X-API-Key: $API_KEY"

# Test Genkit health
echo -e "\n\n4. Testing Genkit health:"
curl -s "$BASE_URL/api/v1/genkit/health" \
  -H "X-API-Key: $API_KEY"

# Test text-to-image (will fail without proper Google credentials)
echo -e "\n\n5. Testing text-to-image endpoint:"
curl -s -X POST "$BASE_URL/api/v1/vertex-ai/text2image" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "numImages": 1,
    "width": 1024,
    "height": 1024
  }'

# Test completion (non-streaming)
echo -e "\n\n6. Testing completion endpoint (non-streaming):"
curl -s -X POST "$BASE_URL/api/v1/genkit/completions" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "prompt": "Hello, how are you?",
    "maxTokens": 100,
    "stream": false
  }'

# Test streaming completion
echo -e "\n\n7. Testing streaming completion endpoint:"
echo "Sending request to streaming endpoint..."
curl -N -X POST "$BASE_URL/api/v1/genkit/completions" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "prompt": "Write a haiku about coding",
    "stream": true
  }'

echo -e "\n\nTests completed!"