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
/**
 * @openapi
 * /api/v1/vertex-ai/text2image:
 *   post:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uploadToCloudinary:
 *                 type: boolean
 *                 description: When true, upload generated images to Cloudinary and return only the URLs
 *               cloudinaryFolder:
 *                 type: string
 *                 description: Optional Cloudinary folder to upload into
 */
router.post('/text2image', vertexAIController.text2Image);

// Video generation
/**
 * @openapi
 * /api/v1/vertex-ai/image2video:
 *   post:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uploadToCloudinary:
 *                 type: boolean
 *                 description: When true, upload generated video to Cloudinary and return only the URL
 *               cloudinaryFolder:
 *                 type: string
 *                 description: Optional Cloudinary folder to upload into
 */
router.post('/image2video', vertexAIController.image2Video);
/**
 * @openapi
 * /api/v1/vertex-ai/text2video:
 *   post:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uploadToCloudinary:
 *                 type: boolean
 *                 description: When true, upload generated video to Cloudinary and return only the URL
 *               cloudinaryFolder:
 *                 type: string
 *                 description: Optional Cloudinary folder to upload into
 */
router.post('/text2video', vertexAIController.text2Video);

export default router;
