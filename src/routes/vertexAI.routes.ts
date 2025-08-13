import { Router } from 'express';
import { authenticate } from '@/middleware/auth.js';
import * as vertexAIController from '@/controllers/vertexAI.controller.js';

/**
 * @openapi
 * tags:
 *   - name: VertexAI
 *     description: Vertex AI image and video utilities
 */
const router: Router = Router();

// All Vertex AI routes require authentication
router.use(authenticate);

// Image generation
router.post('/text2image', vertexAIController.text2Image);

// Video generation
router.post('/image2video', vertexAIController.image2Video);
router.post('/text2video', vertexAIController.text2Video);

// Health check
router.get('/health', vertexAIController.checkVertexAIHealth);

export default router;
