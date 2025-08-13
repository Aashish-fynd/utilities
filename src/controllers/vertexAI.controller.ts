import { Request, Response } from 'express';
import { z } from 'zod';
import { vertexAIService } from '@/services/vertexAI.service.js';
import { asyncHandler } from '@/middleware/errorHandler.js';
import { AuthRequest } from '@/middleware/auth.js';
import { logger } from '@/utils/logger.js';

// Validation schemas
const text2ImageSchema = z.object({
  prompt: z.string().min(1).max(1000),
  negativePrompt: z.string().max(1000).optional(),
  numImages: z.number().int().min(1).max(4).optional(),
  width: z.number().int().min(256).max(2048).optional(),
  height: z.number().int().min(256).max(2048).optional(),
  guidanceScale: z.number().min(1).max(20).optional(),
  seed: z.number().int().optional(),
});

const image2VideoSchema = z.object({
  image: z.string(), // base64 encoded image
  prompt: z.string().max(1000).optional(),
  duration: z.number().min(1).max(10).optional(),
  fps: z.number().int().min(12).max(60).optional(),
  width: z.number().int().min(256).max(1920).optional(),
  height: z.number().int().min(256).max(1080).optional(),
});

const text2VideoSchema = z.object({
  prompt: z.string().min(1).max(1000),
  duration: z.number().min(1).max(10).optional(),
  fps: z.number().int().min(12).max(60).optional(),
  width: z.number().int().min(256).max(1920).optional(),
  height: z.number().int().min(256).max(1080).optional(),
});

export const text2Image = asyncHandler(async (req: AuthRequest, res: Response) => {
  const params = text2ImageSchema.parse(req.body);

  logger.info('Text to image request', {
    userId: req.user?.id,
    prompt: params.prompt.substring(0, 50) + '...',
  });

  const result = await vertexAIService.generateImage(params);

  res.json({
    status: 'success',
    data: result,
  });
});

export const image2Video = asyncHandler(async (req: AuthRequest, res: Response) => {
  const params = image2VideoSchema.parse(req.body);

  logger.info('Image to video request', {
    userId: req.user?.id,
    imageSize: params.image.length,
  });

  const result = await vertexAIService.generateVideoFromImage(params);

  res.json({
    status: 'success',
    data: result,
  });
});

export const text2Video = asyncHandler(async (req: AuthRequest, res: Response) => {
  const params = text2VideoSchema.parse(req.body);

  logger.info('Text to video request', {
    userId: req.user?.id,
    prompt: params.prompt.substring(0, 50) + '...',
  });

  const result = await vertexAIService.generateVideoFromText(params);

  res.json({
    status: 'success',
    data: result,
  });
});

// Health check endpoint for Vertex AI
export const checkVertexAIHealth = asyncHandler(async (_req: Request, res: Response) => {
  // You could add actual health checks here
  res.json({
    status: 'success',
    service: 'vertex-ai',
    healthy: true,
    timestamp: new Date().toISOString(),
  });
});
