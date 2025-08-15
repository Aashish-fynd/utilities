import { Router } from 'express';
import { authenticate, requireScope } from '@/middleware/auth';
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

/**
 * @openapi
 * /api/v1/genkit/completions:
 *   post:
 *     summary: Generate text completion using Genkit
 *     description: Generate text completion using the configured Genkit model with various customization options
 *     tags: [Genkit]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompletionRequest'
 *     responses:
 *       200:
 *         description: Successful completion
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompletionResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - insufficient scope
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/completions',
  validate(genkitController.completionSchema),
  genkitController.createCompletion
);

/**
 * @openapi
 * /api/v1/genkit/completions/stream:
 *   post:
 *     summary: Generate streaming text completion using Genkit
 *     description: Generate text completion with real-time streaming response using the configured Genkit model
 *     tags: [Genkit]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompletionRequest'
 *           example:
 *             prompt: "Write a short story about a robot learning to paint"
 *             systemPrompt: "You are a creative writing assistant"
 *             maxTokens: 1000
 *             temperature: 0.8
 *             stream: true
 *     responses:
 *       200:
 *         description: Streaming completion response
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               description: Server-sent events stream with completion chunks
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - insufficient scope
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/completions/stream',
  validate(genkitController.completionSchema),
  genkitController.streamCompletion
);

export default router;
