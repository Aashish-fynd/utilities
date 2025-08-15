import { Router, Request, Response } from 'express';
import vertexAIRoutes from '@/routes/vertexAI.routes';
import genkitRoutes from '@/routes/genkit.routes';
import audioRoutes from '@/routes/media.routes';
import authRoutes from '@/routes/auth.routes';
import { MODELS } from '@/constants/index';
import { config } from '@/config/index';

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
    docs: '/api/docs',
  });
});

/**
 * @openapi
 * /api/v1/apis:
 *   get:
 *     summary: List available API endpoints by resource and models
 *     tags: [Meta]
 *     responses:
 *       200:
 *         description: API list
 */
router.get('/api/v1/apis', (_req: Request, res: Response) => {
  const list = [
    {
      path: 'generation/text/*',
      method: 'POST',
      description: 'Text generation via Genkit model',
      model: Object.values(MODELS.COMPLETION),
    },
    {
      path: 'generation/image/*',
      method: 'POST',
      description: 'Text to image',
      models: Object.values(MODELS.TEXT_TO_IMAGE),
    },
    {
      path: 'generation/video/*',
      method: 'POST',
      description: 'Text/Image to video',
      models: Object.values(MODELS.TEXT_TO_VIDEO),
    },
  ];
  res.json({ status: 'success', data: list });
});

/**
 * @openapi
 * /api/v1/apis/{category}/{model}:
 *   get:
 *     summary: Get details for a specific generation category/model or * for all
 *     tags: [Meta]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [text, image, video]
 *       - in: path
 *         name: model
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API info
 */
router.get('/api/v1/apis/generation/:category/:model', (req: Request, res: Response) => {
  const { category, model } = req.params as { category: string; model: string };
  if (!['text', 'image', 'video'].includes(category)) {
    return res.status(400).json({ status: 'error', message: 'Invalid category' });
  }
  if (category === 'text') {
    if (model === '*' || model === config.GENKIT_MODEL) {
      return res.json({
        status: 'success',
        data: {
          path: `generation/text/${model}`,
          method: 'POST',
          model: model === '*' ? config.GENKIT_MODEL : model,
        },
      });
    }
    return res.status(404).json({ status: 'error', message: 'Model not found' });
  }
  if (category === 'image') {
    const models = Object.values(MODELS.TEXT_TO_IMAGE);
    if (model === '*')
      return res.json({
        status: 'success',
        data: { path: `generation/image/*`, method: 'POST', models },
      });
    if (models.includes(model))
      return res.json({
        status: 'success',
        data: { path: `generation/image/${model}`, method: 'POST', model },
      });
    return res.status(404).json({ status: 'error', message: 'Model not found' });
  }
  if (category === 'video') {
    const models = Object.values(MODELS.TEXT_TO_VIDEO);
    if (model === '*')
      return res.json({
        status: 'success',
        data: { path: `generation/video/*`, method: 'POST', models },
      });
    if (models.includes(model))
      return res.json({
        status: 'success',
        data: { path: `generation/video/${model}`, method: 'POST', model },
      });
    return res.status(404).json({ status: 'error', message: 'Model not found' });
  }
  return res.status(400).json({ status: 'error', message: 'Invalid request' });
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
  return res.json({
    status: 'success',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

export default router;
