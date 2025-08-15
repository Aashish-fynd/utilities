import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '@/config/index';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vertex AI Utilities API',
      version: '1.1.0',
      description: 'API documentation for Vertex AI Utilities',
    },
    servers: [
      {
        url: config.SWAGGER_SERVER_URL || 'http://localhost:3000',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'Validation failed' },
            details: { type: 'array', items: { type: 'object' }, nullable: true },
          },
        },
        TokenApprovalResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            token: { type: 'object' },
            request: { type: 'object' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  servers: [
    {
      url: config.SWAGGER_SERVER_URL || 'http://localhost:3000',
      description: 'API server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide a valid access token as: Bearer <token>',
      },
      AdminKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Admin-Key',
        description: 'Admin key for administrative operations',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Validation error' },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: { type: 'object' },
        },
      },
      TokenRequest: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
          user_id: { type: 'string', example: 'user-123' },
          requested_apis: {
            type: 'string',
            description: 'Comma separated list',
            example: 'genkit,vertex-ai,media',
          },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'], example: 'pending' },
          admin_note: { type: 'string', nullable: true, example: 'Approved for development use' },
          token_id: { type: 'string', nullable: true, example: 'token-123' },
          created_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00Z' },
        },
      },
      Token: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
          user_id: { type: 'string', example: 'user-123' },
          token: { type: 'string', example: 'abc123def456' },
          apis: {
            type: 'string',
            description: 'Comma separated list',
            example: 'genkit,vertex-ai,media',
          },
          active: { type: 'integer', example: 1 },
          created_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00Z' },
          revoked_at: { type: 'string', nullable: true, example: null },
        },
      },
      Text2ImageRequest: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: {
            type: 'string',
            example: 'A beautiful sunset over mountains',
            minLength: 1,
            maxLength: 1000,
          },
          negativePrompt: { type: 'string', example: 'blurry, low quality', maxLength: 1000 },
          numImages: { type: 'integer', minimum: 1, maximum: 4, example: 1 },
          width: { type: 'integer', minimum: 256, maximum: 2048, example: 1024 },
          height: { type: 'integer', minimum: 256, maximum: 2048, example: 1024 },
          guidanceScale: { type: 'number', minimum: 1, maximum: 20, example: 7.5 },
          seed: { type: 'integer', example: 12345 },
        },
      },
      Text2ImageResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: {
            type: 'object',
            properties: {
              images: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'image-123' },
                    imageBytes: { type: 'string', description: 'Base64 encoded image' },
                    mimeType: { type: 'string', example: 'image/png' },
                  },
                },
              },
              urls: {
                type: 'array',
                items: { type: 'string' },
                description:
                  'Returned when uploadToCloudinary=true: array of Cloudinary URLs for generated images',
              },
            },
          },
        },
      },
      CompletionRequest: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: {
            type: 'string',
            example: 'Explain machine learning in simple terms',
            minLength: 1,
            maxLength: 10000,
          },
          systemPrompt: { type: 'string', example: 'You are a helpful assistant', maxLength: 2000 },
          maxTokens: { type: 'integer', minimum: 1, maximum: 4096, example: 2048 },
          temperature: { type: 'number', minimum: 0, maximum: 2, example: 0.7 },
          topP: { type: 'number', minimum: 0, maximum: 1, example: 0.9 },
          topK: { type: 'integer', minimum: 1, maximum: 100, example: 40 },
          stopSequences: { type: 'array', items: { type: 'string' }, example: ['END', 'STOP'] },
          stream: { type: 'boolean', example: false },
        },
      },
      SpeechToTextRequest: {
        type: 'object',
        required: ['audio', 'encoding', 'sampleRateHertz'],
        properties: {
          audio: {
            type: 'string',
            description: 'Base64-encoded audio bytes',
            example:
              'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
          },
          encoding: {
            type: 'string',
            enum: ['LINEAR16', 'MP3', 'OGG_OPUS', 'MULAW', 'ALAW'],
            example: 'OGG_OPUS',
          },
          sampleRateHertz: { type: 'integer', example: 16000 },
          languageCode: { type: 'string', example: 'en-US' },
        },
      },
      TextToSpeechRequest: {
        type: 'object',
        required: ['text'],
        properties: {
          text: {
            type: 'string',
            example: 'Hello, world! This is a test of text-to-speech synthesis.',
          },
          voice: {
            type: 'object',
            properties: {
              languageCode: { type: 'string', example: 'en-US' },
              name: { type: 'string', example: 'en-US-Neural2-D' },
            },
          },
          audioConfig: {
            type: 'object',
            properties: {
              audioEncoding: {
                type: 'string',
                enum: ['MP3', 'OGG_OPUS', 'LINEAR16'],
                example: 'MP3',
              },
            },
          },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  tags: [
    {
      name: 'Auth',
      description: 'Token request and admin approval endpoints',
    },
    {
      name: 'Genkit',
      description: 'Genkit text generation and completion endpoints',
    },
    {
      name: 'Media',
      description: 'Audio transcription and synthesis endpoints',
    },
    {
      name: 'VertexAI',
      description: 'Vertex AI image and video generation utilities',
    },
    {
      name: 'Meta',
      description: 'API metadata endpoints',
    },
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
