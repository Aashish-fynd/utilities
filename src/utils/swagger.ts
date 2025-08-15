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
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['src/routes/*.ts', 'src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
