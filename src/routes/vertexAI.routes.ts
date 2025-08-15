import { Router } from 'express';
import { authenticate, requireScope } from '@/middleware/auth';
import * as vertexAIController from '@/controllers/vertexAI.controller';
import { validate } from '@/middleware/validation';

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

/**
 * @openapi
 * /api/v1/vertex-ai/text2image:
 *   post:
 *     summary: Generate images from text prompts
 *     description: Generate high-quality images from text descriptions using Vertex AI's image generation models
 *     tags: [VertexAI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Text2ImageRequest'
 *     responses:
 *       200:
 *         description: Images generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Text2ImageResponse'
 *       400:
 *         description: Invalid request parameters
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
 *       500:
 *         description: Image generation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/text2image',
  validate(vertexAIController.text2ImageSchema),
  vertexAIController.text2Image
);

/**
 * @openapi
 * /api/v1/vertex-ai/image2video:
 *   post:
 *     summary: Generate video from image and text prompt
 *     description: Create a video animation from a base image and text description using Vertex AI's video generation models
 *     tags: [VertexAI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VideoGenerationRequest'
 *           example:
 *             prompt: "Make the cat in the image start playing with a ball"
 *             image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
 *             uploadToCloudinary: true
 *             cloudinaryFolder: "ai-videos"
 *     responses:
 *       200:
 *         description: Video generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VideoGenerationResponse'
 *       400:
 *         description: Invalid request parameters
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
 *       500:
 *         description: Video generation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/image2video',
  validate(vertexAIController.image2VideoSchema),
  vertexAIController.image2Video
);
/**
 * @openapi
 * /api/v1/vertex-ai/text2video:
 *   post:
 *     summary: Generate video from text prompt
 *     description: Create a video directly from a text description using Vertex AI's video generation models
 *     tags: [VertexAI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VideoGenerationRequest'
 *           example:
 *             prompt: "A golden retriever running through a field of sunflowers at sunset"
 *             uploadToCloudinary: true
 *             cloudinaryFolder: "ai-videos"
 *     responses:
 *       200:
 *         description: Video generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VideoGenerationResponse'
 *       400:
 *         description: Invalid request parameters
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
 *       500:
 *         description: Video generation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/text2video',
  validate(vertexAIController.text2VideoSchema),
  vertexAIController.text2Video
);

export default router;
