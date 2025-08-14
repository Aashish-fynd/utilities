import { Router, Request, Response } from 'express';
import vertexAIRoutes from '@/routes/vertexAI.routes.js';
import genkitRoutes from '@/routes/genkit.routes.js';
import audioRoutes from '@/routes/media.routes.js';
import authRoutes from '@/routes/auth.routes.js';

const router: Router = Router();

// Mount route modules
router.use('/api/v1/vertex-ai', vertexAIRoutes);
router.use('/api/v1/genkit', genkitRoutes);
router.use('/api/v1/media', audioRoutes);
router.use('/api/v1/auth', authRoutes);

/**
 * @openapi
 * /:
 *   get:
 *     summary: API root describing available endpoints
 *     tags: [Meta]
 *     responses:
 *       200:
 *         description: Root description
 */
// Root endpoint
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Vertex AI Utilities API',
    version: '1.1.0',
    endpoints: {
      vertexAI: {
        text2image: 'POST /api/v1/vertex-ai/text2image',
        image2video: 'POST /api/v1/vertex-ai/image2video',
        text2video: 'POST /api/v1/vertex-ai/text2video',
        health: 'GET /api/v1/vertex-ai/health',
      },
      genkit: {
        completions: 'POST /api/v1/genkit/completions',
        streamCompletions: 'POST /api/v1/genkit/completions/stream',
        health: 'GET /api/v1/genkit/health',
      },
      media: {
        speechToText: 'POST /api/v1/media/speech-to-text',
        textToSpeech: 'POST /api/v1/media/text-to-speech',
        health: 'GET /api/v1/media/health',
      },
      auth: {
        request: 'POST /api/v1/auth/request',
        listRequests: 'GET /api/v1/auth/requests?status=pending',
        approve: 'POST /api/v1/auth/approve',
        reject: 'POST /api/v1/auth/reject',
      },
    },
    docs: '/api/docs',
  });
});

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Service health status
 *     tags: [Meta]
 *     responses:
 *       200:
 *         description: Health info
 */
// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

export default router;
