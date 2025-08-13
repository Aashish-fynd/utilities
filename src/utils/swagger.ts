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
			ApiKeyAuth: {
				type: 'apiKey',
				in: 'header',
				name: 'X-API-Key',
				description: 'API key authentication using the X-API-Key header',
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
		},
	},
	security: [{ ApiKeyAuth: [] }],
};

export const swaggerSpec = swaggerJSDoc({
	definition: swaggerDefinition,
	apis: ['src/routes/*.ts', 'src/controllers/*.ts'],
});