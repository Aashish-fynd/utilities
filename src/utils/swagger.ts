import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '@/config/index.js';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Vertex AI Utilities API',
    version: '1.1.0',
    description:
      'API for Vertex AI utilities including image/video generation, Genkit completions, and audio transcription/synthesis.',
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
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Validation error' },
        },
      },
      TokenRequest: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string' },
          requested_apis: { type: 'string', description: 'Comma separated list' },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
          admin_note: { type: 'string', nullable: true },
          token_id: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Token: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string' },
          token: { type: 'string' },
          apis: { type: 'string', description: 'Comma separated list' },
          active: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          revoked_at: { type: 'string', nullable: true },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: ['src/routes/*.ts', 'src/controllers/*.ts'],
});
