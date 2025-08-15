import { Router } from 'express';
import { authenticate, requireScope } from '@/middleware/auth';
import { usageLogger } from '@/middleware/usage';
import * as genkitController from '@/controllers/genkit.controller';
import { validate } from '@/middleware/validation';

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

// Log usage for all endpoints under this router
router.use(usageLogger());

// Completion endpoints
router.post(
  '/completions',
  validate(genkitController.completionSchema),
  genkitController.createCompletion
);
router.post(
  '/completions/stream',
  validate(genkitController.completionSchema),
  genkitController.streamCompletion
);

export default router;
