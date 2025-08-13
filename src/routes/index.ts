import { Router, Request, Response } from 'express';
import vertexAIRoutes from '@/routes/vertexAI.routes.js';
import genkitRoutes from '@/routes/genkit.routes.js';

const router: Router = Router();

// Mount route modules
router.use('/api/v1/vertex-ai', vertexAIRoutes);
router.use('/api/v1/genkit', genkitRoutes);

// Root endpoint
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Vertex AI Utilities API',
    version: '1.0.0',
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
    },
    docs: '/api/docs',
  });
});

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
