import { Response } from 'express';
import { z } from 'zod';
import { vertexAIService } from '@/services/vertexAI.service';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthRequest } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { MODELS } from '@/constants/index';
import { uploadToCloudinary } from '@/services/cloudinary.service';
import { logUsage } from '@/utils/usage';

// Validation schemas
export const text2ImageSchema = z.object({
  prompt: z.string().min(1).max(1000),
  sampleCount: z.number().int().min(1).max(4).optional(),
  width: z.number().int().min(256).max(2048).optional(),
  height: z.number().int().min(256).max(2048).optional(),
  model: z.enum(Object.values(MODELS.TEXT_TO_IMAGE)),
  uploadToCloudinary: z.boolean().optional(),
});

export const image2VideoSchema = z.object({
  image: z.string(), // base64 encoded image
  prompt: z.string().max(1000).optional(),
  duration: z.number().min(1).max(10).optional(),
  fps: z.number().int().min(12).max(60).optional(),
  width: z.number().int().min(256).max(1920).optional(),
  height: z.number().int().min(256).max(1080).optional(),
  model: z.enum(Object.values(MODELS.TEXT_TO_VIDEO)),
  uploadToCloudinary: z.boolean().optional(),
});

export const text2VideoSchema = z.object({
  prompt: z.string().min(1).max(1000),
  duration: z.number().min(1).max(10).optional(),
  fps: z.number().int().min(12).max(60).optional(),
  width: z.number().int().min(256).max(1920).optional(),
  height: z.number().int().min(256).max(1080).optional(),
  model: z.enum(Object.values(MODELS.TEXT_TO_VIDEO)),
  uploadToCloudinary: z.boolean().optional(),
});

/**
 * @openapi
 * /api/v1/vertex-ai/text2image:
 *   post:
 *     summary: Generate images from a text prompt
 *     tags: [VertexAI]
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
 *               model:
 *                 type: string
 *                 enum:
 *                   - ${Object.values(MODELS.TEXT_TO_IMAGE).join(', ')}
 *               negativePrompt:
 *                 type: string
 *               numImages:
 *                 type: integer
 *               width:
 *                 type: integer
 *               height:
 *                 type: integer
 *               guidanceScale:
 *                 type: number
 *               seed:
 *                 type: integer
 *     responses:
 *       200:
 *         description: A list of generated images
 */
export const text2Image = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requestBody = req.body;

  logger.info('Text to image request', {
    userId: req.user?.id,
    prompt: requestBody.prompt.substring(0, 50) + '...',
  });

  const result = await vertexAIService.generateImage(requestBody);

  if (requestBody.uploadToCloudinary) {
    const promises = [];
    for (const item of (result as any).images || []) {
      const base64: string | undefined = item?.base64;
      const mime: string = item?.mimeType;

      let fileForUpload: string | undefined = undefined;
      if (base64) {
        fileForUpload = `data:${mime};base64,${base64}`;
      }

      if (!fileForUpload) continue;

      promises.push(uploadToCloudinary({ file: fileForUpload, resourceType: 'image' }));
    }

    const urls = await Promise.all(promises);

    (result as any).images = urls;

    logUsage({
      req,
      res,
      data: result.output,
    });

    return res.json({ status: 'success', data: result });
  }

  return res.json({
    status: 'success',
    data: result,
  });
});

/**
 * @openapi
 * /api/v1/vertex-ai/image2video:
 *   post:
 *     summary: Generate a short video from an input image
 *     tags: [VertexAI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 description: Base64-encoded image bytes
 *                 example: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
 *               prompt:
 *                 type: string
 *                 description: Optional text prompt to guide video generation
 *                 maxLength: 1000
 *                 example: "Make the image come to life with gentle movement"
 *               duration:
 *                 type: number
 *                 description: Duration of the generated video in seconds
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 5
 *                 example: 5
 *               fps:
 *                 type: integer
 *                 description: Frames per second for the generated video
 *                 minimum: 12
 *                 maximum: 60
 *                 default: 24
 *                 example: 24
 *               width:
 *                 type: integer
 *                 description: Width of the generated video in pixels
 *                 minimum: 256
 *                 maximum: 1920
 *                 default: 1024
 *                 example: 1024
 *               height:
 *                 type: integer
 *                 description: Height of the generated video in pixels
 *                 minimum: 256
 *                 maximum: 1080
 *                 default: 576
 *                 example: 576
 *     responses:
 *       200:
 *         description: Generated video data
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
 *                     video:
 *                       type: string
 *                       description: Base64-encoded video bytes
 *                     mimeType:
 *                       type: string
 *                       example: "video/mp4"
 *                     duration:
 *                       type: number
 *                       example: 5.0
 *                     fps:
 *                       type: integer
 *                       example: 24
 *                     width:
 *                       type: integer
 *                       example: 1024
 *                     height:
 *                       type: integer
 *                       example: 576
 *                     model:
 *                       type: string
 *                       example: "veo-3.0-generate-001"
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
export const image2Video = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requestBody = req.body;

  logger.info('Image to video request', {
    userId: req.user?.id,
    imageSize: requestBody.image.length,
  });

  const result = await vertexAIService.generateVideoFromImage(requestBody);

  if (requestBody.uploadToCloudinary) {
    const fileForUpload = (result as any).videoUrl as string; // should be data URL
    (result as any).videoUrl = await uploadToCloudinary({
      file: fileForUpload,
      resourceType: 'video',
    });
  }

  logUsage({
    req,
    res,
    data: result.output,
  });

  return res.json({
    status: 'success',
    data: result,
  });
});

/**
 * @openapi
 * /api/v1/vertex-ai/text2video:
 *   post:
 *     summary: Generate a short video from a text prompt
 *     tags: [VertexAI]
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
 *                 description: Text prompt describing the video to generate
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: "A serene mountain landscape with flowing clouds and gentle wind"
 *               duration:
 *                 type: number
 *                 description: Duration of the generated video in seconds
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 5
 *                 example: 5
 *               fps:
 *                 type: integer
 *                 description: Frames per second for the generated video
 *                 minimum: 12
 *                 maximum: 60
 *                 default: 24
 *                 example: 24
 *               width:
 *                 type: integer
 *                 description: Width of the generated video in pixels
 *                 minimum: 256
 *                 maximum: 1920
 *                 default: 1024
 *                 example: 1024
 *               height:
 *                 type: integer
 *                 description: Height of the generated video in pixels
 *                 minimum: 256
 *                 maximum: 1080
 *                 default: 576
 *                 example: 576
 *     responses:
 *       200:
 *         description: Generated video data
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
 *                     video:
 *                       type: string
 *                       description: Base64-encoded video bytes
 *                     mimeType:
 *                       type: string
 *                       example: "video/mp4"
 *                     duration:
 *                       type: number
 *                       example: 5.0
 *                     fps:
 *                       type: integer
 *                       example: 24
 *                     width:
 *                       type: integer
 *                       example: 1024
 *                     height:
 *                       type: integer
 *                       example: 576
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
export const text2Video = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requestBody = req.body;

  const result = await vertexAIService.generateVideoFromText(requestBody);

  if (requestBody.uploadToCloudinary) {
    const fileForUpload = (result as any).videoUrl as string; // should be data URL
    (result as any).videoUrl = await uploadToCloudinary({
      file: fileForUpload,
      resourceType: 'video',
    });
  }

  logUsage({
    req,
    res,
    data: result.output,
  });

  return res.json({
    status: 'success',
    data: result,
  });
});
