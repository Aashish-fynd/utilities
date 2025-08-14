import { Router } from 'express';
import { authenticate, requireScope } from '@/middleware/auth.js';
import * as genkitController from '@/controllers/genkit.controller.js';

/**
 * @openapi
 * tags:
 *   - name: Genkit
 *     description: Genkit text generation endpoints
 */
const router: Router = Router();

// All Genkit routes require authentication
router.use(authenticate);
router.use(requireScope('genkit'));

// Completion endpoints
router.post('/completions', genkitController.createCompletion);
router.post('/completions/stream', genkitController.streamCompletion);

export default router;
