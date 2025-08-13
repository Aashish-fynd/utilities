import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import * as vertexAIController from '../controllers/vertexAI.controller.js';

const router = Router();

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