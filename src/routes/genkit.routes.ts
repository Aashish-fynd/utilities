import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as genkitController from '../controllers/genkit.controller.js';

const router = Router();

// All Genkit routes require authentication
router.use(authenticate);

// Completion endpoints
router.post('/completions', genkitController.createCompletion);
router.post('/completions/stream', genkitController.streamCompletion);

// Health check
router.get('/health', genkitController.checkGenkitHealth);

export default router;