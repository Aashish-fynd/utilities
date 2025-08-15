import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '@/config/index.js';

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
  apis: ['src/routes/*.ts', 'src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
