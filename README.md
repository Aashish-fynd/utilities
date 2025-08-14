# Vertex AI Utilities API

A scalable and reliable API service that provides utilities for Google's Vertex AI, including text-to-image, image-to-video, text-to-video generation, and streaming completions using Genkit.

## Features

- **Text-to-Image Generation**: Generate images from text prompts using Vertex AI
- **Image-to-Video Generation**: Convert images to videos with optional text prompts
- **Text-to-Video Generation**: Generate videos directly from text prompts
- **Streaming Completions**: Real-time text generation using Genkit with SSE (Server-Sent Events)
- **Audio to Text (STT)**: Transcribe audio with Genkit-compatible models
- **Text to Audio (TTS)**: Synthesize speech via Genkit with audio outputs
- **Swagger Docs**: Interactive API documentation at `/api/docs`
- **Cloudflare Workers Compatible**: Designed to be deployed on Cloudflare's edge network
- **TypeScript**: Fully typed for better developer experience
- **Scalable Architecture**: Modular design with proper separation of concerns
- **Comprehensive Error Handling**: Detailed error messages and proper HTTP status codes
- **Security**: Bearer access token auth, rate limiting, and security headers

## Prerequisites

- Node.js 18+ 
- pnpm
- Google Cloud Project with Vertex AI enabled
- Cloudflare account (for deployment)

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Configure your environment variables:

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
VERTEX_AI_LOCATION=us-central1

# API Configuration
ACCESS_TOKEN=your-strong-access-token
PORT=3000
```

## Development

Run the development server:

```bash
pnpm dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication

All API endpoints require Bearer access token.
- Header: `Authorization: Bearer <your-access-token>`

### Swagger

- OpenAPI JSON: `GET /api/docs.json`
- Swagger UI: `GET /api/docs`

### Swagger

- OpenAPI JSON: `GET /api/docs.json`
- Swagger UI: `GET /api/docs`

### Vertex AI Endpoints

#### Generate Image from Text

```bash
POST /api/v1/vertex-ai/text2image
Content-Type: application/json
Authorization: Bearer <your-access-token>

{
  "prompt": "A beautiful sunset over mountains",
  "numImages": 1,
  "width": 1024,
  "height": 1024
}
```

#### Generate Video from Image

```bash
POST /api/v1/vertex-ai/image2video
Content-Type: application/json
Authorization: Bearer <your-access-token>

{
  "image": "base64-encoded-image-data",
  "prompt": "Make the clouds move",
  "duration": 4,
  "fps": 24
}
```

#### Generate Video from Text

```bash
POST /api/v1/vertex-ai/text2video
Content-Type: application/json
Authorization: Bearer <your-access-token>

{
  "prompt": "A cat playing with a ball",
  "duration": 4,
  "fps": 24,
  "width": 1280,
  "height": 720
}
```

### Genkit Endpoints

#### Generate Completion (Non-streaming)

```bash
POST /api/v1/genkit/completions
Content-Type: application/json
Authorization: Bearer <your-access-token>

{
  "prompt": "Explain quantum computing",
  "systemPrompt": "You are a helpful assistant",
  "maxTokens": 1024,
  "temperature": 0.7,
  "stream": false
}
```

#### Generate Completion (Streaming with SSE)

```bash
POST /api/v1/genkit/completions
Content-Type: application/json
Authorization: Bearer <your-access-token>

{
  "prompt": "Write a story about a dragon",
  "stream": true
}
```

### Media Endpoints

#### Speech to Text

```bash
POST /api/v1/media/speech-to-text
Content-Type: application/json
Authorization: Bearer <your-access-token>

{
  "audio": "<base64-audio>",
  "encoding": "OGG_OPUS",
  "sampleRateHertz": 16000,
  "languageCode": "en-US"
}
```

#### Text to Speech

```bash
POST /api/v1/media/text-to-speech
Content-Type: application/json
Authorization: Bearer <your-access-token>

{
  "text": "Hello world",
  "voice": { "languageCode": "en-US" },
  "audioConfig": { "audioEncoding": "MP3" }
}
```

### Media Endpoints

#### Speech to Text

```bash
POST /api/v1/media/speech-to-text
Content-Type: application/json
X-API-Key: your-api-key

{
  "audio": "<base64-audio>",
  "encoding": "OGG_OPUS",
  "sampleRateHertz": 16000,
  "languageCode": "en-US"
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "text": "transcribed text",
    "alternatives": [
      { "text": "...", "confidence": 0.91 }
    ],
    "metadata": { "provider": "google", "service": "speech-to-text" }
  }
}
```

#### Text to Speech

```bash
POST /api/v1/media/text-to-speech
Content-Type: application/json
X-API-Key: your-api-key

{
  "text": "Hello world",
  "voice": { "languageCode": "en-US", "name": "en-US-Neural2-D" },
  "audioConfig": { "audioEncoding": "MP3" }
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "audioContent": "<base64-mp3>",
    "mimeType": "audio/mpeg",
    "metadata": { "provider": "google", "service": "text-to-speech" }
  }
}
```

## Building for Production

```bash
pnpm build
```

## Deployment to Cloudflare Workers

Set your secrets and deploy as needed.