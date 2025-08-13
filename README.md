# Vertex AI Utilities API

A scalable and reliable API service that provides utilities for Google's Vertex AI, including text-to-image, image-to-video, text-to-video generation, and streaming completions using Genkit.

## Features

- **Text-to-Image Generation**: Generate images from text prompts using Vertex AI
- **Image-to-Video Generation**: Convert images to videos with optional text prompts
- **Text-to-Video Generation**: Generate videos directly from text prompts
- **Streaming Completions**: Real-time text generation using Genkit with SSE (Server-Sent Events)
- **Audio to Text (STT)**: Transcribe audio with Google Cloud Speech-to-Text
- **Text to Audio (TTS)**: Synthesize speech with Google Cloud Text-to-Speech
- **Swagger Docs**: Interactive API documentation at `/api/docs`
- **Cloudflare Workers Compatible**: Designed to be deployed on Cloudflare's edge network
- **TypeScript**: Fully typed for better developer experience
- **Scalable Architecture**: Modular design with proper separation of concerns
- **Comprehensive Error Handling**: Detailed error messages and proper HTTP status codes
- **Security**: API key authentication, rate limiting, and security headers

## Prerequisites

- Node.js 18+ 
- pnpm
- Google Cloud Project with Vertex AI, Speech-to-Text, and Text-to-Speech enabled
- Google Cloud Service Account with appropriate permissions
- Cloudflare account (for deployment)

## Setup

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Copy the environment example file:

```bash
cp .env.example .env
```

3. Configure your environment variables:

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json

# Vertex AI Configuration
VERTEX_AI_LOCATION=us-central1

# API Configuration
API_KEY=your-secure-api-key
PORT=3000
```

4. Set up Google Cloud credentials:

```bash
# Download your service account key from Google Cloud Console
# Place it in a secure location and update GOOGLE_APPLICATION_CREDENTIALS path
```

## Development

Run the development server:

```bash
pnpm dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication

All API endpoints require authentication via API key. Include the key in one of these ways:
- Header: `X-API-Key: your-api-key`
- Query parameter: `?api_key=your-api-key`

### Swagger

- OpenAPI JSON: `GET /api/docs.json`
- Swagger UI: `GET /api/docs`

### Vertex AI Endpoints

#### Generate Image from Text

```bash
POST /api/v1/vertex-ai/text2image
Content-Type: application/json
X-API-Key: your-api-key

{
  "prompt": "A beautiful sunset over mountains",
  "negativePrompt": "blurry, low quality",
  "numImages": 1,
  "width": 1024,
  "height": 1024,
  "guidanceScale": 7.5
}
```

#### Generate Video from Image

```bash
POST /api/v1/vertex-ai/image2video
Content-Type: application/json
X-API-Key: your-api-key

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
X-API-Key: your-api-key

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
X-API-Key: your-api-key

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
X-API-Key: your-api-key

{
  "prompt": "Write a story about a dragon",
  "stream": true
}
```

Example client code for streaming:

```javascript
const eventSource = new EventSource('/api/v1/genkit/completions?api_key=your-key');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'content') {
    console.log('Received:', data.content);
  } else if (data.type === 'done') {
    eventSource.close();
  }
};
```

#### Alternative Streaming Endpoint (NDJSON)

```bash
POST /api/v1/genkit/completions/stream
Content-Type: application/json
X-API-Key: your-api-key

{
  "prompt": "Explain machine learning",
  "maxTokens": 2048
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

Build the TypeScript code:

```bash
pnpm build
```

## Deployment to Cloudflare Workers

1. Configure your `wrangler.toml` file with your account details:

```toml
name = "vertex-ai-utilities"
account_id = "your-account-id"
```

2. Add your secrets to Cloudflare:

```bash
wrangler secret put GOOGLE_CLOUD_PROJECT
wrangler secret put GOOGLE_APPLICATION_CREDENTIALS
wrangler secret put API_KEY
```

3. Deploy to Cloudflare Workers:

```bash
wrangler publish
```

## Architecture

```
src/
├── config/         # Configuration management
├── controllers/    # Request handlers
├── middleware/     # Express middleware
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── index.ts        # Express server
└── worker.ts       # Cloudflare Worker entry
```

## Security Considerations

1. **API Keys**: Always use strong, randomly generated API keys
2. **Rate Limiting**: Configured to prevent abuse (100 requests per 15 minutes by default)
3. **CORS**: Configure allowed origins for production
4. **Input Validation**: All inputs are validated using Zod schemas
5. **Error Handling**: Sensitive information is not exposed in error messages

## Monitoring and Logging

- Logs are written using Winston logger
- In production, logs are written to files
- Cloudflare provides built-in analytics and logging

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure your Google Cloud credentials are properly configured
2. **Rate Limiting**: Adjust `RATE_LIMIT_MAX_REQUESTS` if needed
3. **Cloudflare Deployment**: Ensure all environment variables are set as secrets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT