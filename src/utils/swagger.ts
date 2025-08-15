import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '@/config/index';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vertex AI Utilities API',
      version: '1.1.0',
      description:
        'API documentation for Vertex AI Utilities - A comprehensive API for AI-powered text generation, image generation, video generation, and audio processing.',
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
            details: { type: 'array', items: { type: 'object' }, nullable: true },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: { type: 'object' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '674a1234567890abcdef1234' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            isAdmin: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TokenRequest: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '674a1234567890abcdef1234' },
            userId: { type: 'string', example: '674a1234567890abcdef1234' },
            requestedApis: {
              type: 'array',
              items: { type: 'string' },
              example: ['genkit', 'vertex-ai', 'media'],
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
              example: 'pending',
            },
            adminNote: { type: 'string', nullable: true, example: 'Approved for development use' },
            tokenId: { type: 'string', nullable: true, example: '674a1234567890abcdef1234' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Token: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '674a1234567890abcdef1234' },
            userId: { type: 'string', example: '674a1234567890abcdef1234' },
            apis: {
              type: 'array',
              items: { type: 'string' },
              example: ['genkit', 'vertex-ai', 'media'],
            },
            active: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            revokedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        RefreshToken: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            userId: { type: 'string', example: '674a1234567890abcdef1234' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
        TokenApprovalResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            token: { $ref: '#/components/schemas/Token' },
            request: { $ref: '#/components/schemas/TokenRequest' },
          },
        },
        UsageLog: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '674a1234567890abcdef1234' },
            tokenId: { type: 'string', example: '674a1234567890abcdef1234' },
            endpoint: { type: 'string', example: '/api/v1/vertex-ai/text2image' },
            method: { type: 'string', example: 'POST' },
            statusCode: { type: 'integer', example: 200 },
            duration: {
              type: 'integer',
              example: 1234,
              description: 'Request duration in milliseconds',
            },
            createdAt: { type: 'string', format: 'date-time' },
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
            systemPrompt: {
              type: 'string',
              example: 'You are a helpful assistant',
              maxLength: 2000,
            },
            maxTokens: { type: 'integer', minimum: 1, maximum: 4096, example: 2048 },
            temperature: { type: 'number', minimum: 0, maximum: 2, example: 0.7 },
            topP: { type: 'number', minimum: 0, maximum: 1, example: 0.9 },
            topK: { type: 'integer', minimum: 1, maximum: 100, example: 40 },
            stopSequences: { type: 'array', items: { type: 'string' }, example: ['END', 'STOP'] },
            stream: { type: 'boolean', example: false },
          },
        },
        CompletionResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  example: 'Machine learning is a subset of artificial intelligence...',
                },
                model: { type: 'string', example: 'gemini-1.5-flash' },
                usage: {
                  type: 'object',
                  properties: {
                    inputTokens: { type: 'integer', example: 15 },
                    outputTokens: { type: 'integer', example: 150 },
                    totalTokens: { type: 'integer', example: 165 },
                  },
                },
              },
            },
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
            uploadToCloudinary: { type: 'boolean', example: false },
            cloudinaryFolder: { type: 'string', example: 'ai-generated' },
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
        VideoGenerationRequest: {
          type: 'object',
          required: ['prompt'],
          properties: {
            prompt: {
              type: 'string',
              example: 'A cat playing with a ball of yarn',
              minLength: 1,
              maxLength: 1000,
            },
            image: {
              type: 'string',
              description: 'Base64 encoded image for image-to-video generation',
            },
            uploadToCloudinary: { type: 'boolean', example: false },
            cloudinaryFolder: { type: 'string', example: 'ai-videos' },
          },
        },
        VideoGenerationResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              properties: {
                videoBytes: { type: 'string', description: 'Base64 encoded video' },
                mimeType: { type: 'string', example: 'video/mp4' },
                url: { type: 'string', description: 'Cloudinary URL when uploadToCloudinary=true' },
              },
            },
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
        SpeechToTextResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              properties: {
                transcript: { type: 'string', example: 'Hello, this is a test transcription.' },
                confidence: { type: 'number', example: 0.95 },
              },
            },
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
            uploadToCloudinary: { type: 'boolean', example: false },
            cloudinaryFolder: { type: 'string', example: 'ai-audio' },
          },
        },
        TextToSpeechResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              properties: {
                audioBytes: { type: 'string', description: 'Base64 encoded audio' },
                mimeType: { type: 'string', example: 'audio/mp3' },
                url: { type: 'string', description: 'Cloudinary URL when uploadToCloudinary=true' },
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
  },
  apis: ['./src/routes/*.ts', './src/routes/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
