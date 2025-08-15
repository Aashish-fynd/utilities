import { Router } from 'express';
import { authenticate, requireScope } from '@/middleware/auth';
import { usageLogger } from '@/middleware/usage';
import * as vertexAIController from '@/controllers/vertexAI.controller';

/**
 * @openapi
 * tags:
 *   - name: VertexAI
 *     description: Vertex AI image and video utilities
 */
const router: Router = Router();

// All Vertex AI routes require authentication
router.use(authenticate);
router.use(requireScope('vertex-ai'));

// Log usage for all endpoints under this router
router.use(usageLogger());

// Image generation
router.post('/text2image', vertexAIController.text2Image);

// Video generation
router.post('/image2video', vertexAIController.image2Video);
router.post('/text2video', vertexAIController.text2Video);

export default router;
