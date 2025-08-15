import { Response } from 'express';
import { z } from 'zod';
import { genkitService } from '@/services/genkit.service';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthRequest } from '@/middleware/auth';
import { logger } from '@/utils/logger';

// Validation schema for completion requests
export const completionSchema = z.object({
  prompt: z.string().min(1).max(10000),
  systemPrompt: z.string().max(2000).optional(),
  maxTokens: z.number().int().min(1).max(4096).optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().int().min(1).max(100).optional(),
  stopSequences: z.array(z.string()).max(5).optional(),
  stream: z.boolean().optional().default(false),
});

/**
 * @openapi
 * /api/v1/genkit/completions:
 *   post:
 *     summary: Generate a text completion (supports streaming when stream=true)
 *     tags: [Genkit]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [prompt]
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: The text prompt to complete
 *                 minLength: 1
 *                 maxLength: 10000
 *                 example: "Explain machine learning in simple terms"
 *               systemPrompt:
 *                 type: string
 *                 description: System prompt to set the AI's behavior
 *                 maxLength: 2000
 *                 example: "You are a helpful assistant that explains complex topics simply"
 *               maxTokens:
 *                 type: integer
 *                 description: Maximum number of tokens to generate
 *                 minimum: 1
 *                 maximum: 4096
 *                 default: 2048
 *                 example: 2048
 *               temperature:
 *                 type: number
 *                 description: Controls randomness in generation (0 = deterministic, 2 = very random)
 *                 minimum: 0
 *                 maximum: 2
 *                 default: 0.7
 *                 example: 0.7
 *               topP:
 *                 type: number
 *                 description: Nucleus sampling parameter (0-1)
 *                 minimum: 0
 *                 maximum: 1
 *                 default: 0.9
 *                 example: 0.9
 *               topK:
 *                 type: integer
 *                 description: Top-k sampling parameter
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 40
 *                 example: 40
 *               stopSequences:
 *                 type: array
 *                 description: Sequences that stop generation when encountered
 *                 items:
 *                   type: string
 *                 maxItems: 5
 *                 example: ["END", "STOP"]
 *               stream:
 *                 type: boolean
 *                 description: Whether to stream the response as Server-Sent Events
 *                 default: false
 *                 example: false
 *     responses:
 *       200:
 *         description: Completion result or SSE stream when stream=true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       description: Generated completion text
 *                     usage:
 *                       type: object
 *                       properties:
 *                         promptTokens:
 *                           type: integer
 *                           example: 10
 *                         completionTokens:
 *                           type: integer
 *                           example: 50
 *                         totalTokens:
 *                           type: integer
 *                           example: 60
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
export const createCompletion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requestBody = req.body;

  logger.info('Completion request', {
    userId: req.user?.id,
    stream: requestBody.stream,
    promptLength: requestBody.prompt.length,
  });

  if (requestBody.stream) {
    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

    // Send initial connection message
    res.write('data: {"type":"connection","status":"connected"}\n\n');

    try {
      const stream = genkitService.streamCompletion(requestBody);

      for await (const chunk of stream) {
        // Send each chunk as SSE event
        const event = JSON.stringify({ type: 'content', content: chunk });
        res.write(`data: ${event}\n\n`);

        // Flush the response to ensure data is sent immediately
        if (res.flush) res.flush();
      }

      // Send completion event
      res.write('data: {"type":"done","status":"completed"}\n\n');
      res.end();
    } catch (error) {
      const errorEvent = JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.write(`data: ${errorEvent}\n\n`);
      res.end();
    }
  } else {
    // Non-streaming response
    const result = await genkitService.generateCompletion(requestBody);

    res.json({
      status: 'success',
      data: result,
    });
  }
});

// Alternative streaming endpoint using chunked transfer encoding
/**
 * @openapi
 * /api/v1/genkit/completions/stream:
 *   post:
 *     summary: Generate a text completion streamed as NDJSON
 *     tags: [Genkit]
 *     responses:
 *       200:
 *         description: NDJSON stream of completion chunks
 */
export const streamCompletion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requestBody = req.body;

  // Set headers for streaming JSON
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const stream = genkitService.streamCompletion(requestBody);

    for await (const chunk of stream) {
      // Send each chunk as newline-delimited JSON
      res.write(JSON.stringify({ chunk }) + '\n');

      // Flush the response
      if (res.flush) res.flush();
    }

    // Send final metadata
    res.write(
      JSON.stringify({
        done: true,
        metadata: {
          model: 'gemini-1.5-pro',
          timestamp: new Date().toISOString(),
        },
      }) + '\n'
    );

    res.end();
  } catch (error) {
    res.write(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }) + '\n'
    );
    res.end();
  }
});
