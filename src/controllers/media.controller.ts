import { Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthRequest } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { mediaService } from '@/services/media.service';

// Validation schemas
const speechToTextSchema = z.object({
  audio: z.string(), // base64
  encoding: z.enum(['LINEAR16', 'MP3', 'OGG_OPUS', 'MULAW', 'ALAW']),
  sampleRateHertz: z.number().int(),
  languageCode: z.string().optional(),
});

const textToSpeechSchema = z.object({
  text: z.string(),
  voice: z
    .object({
      languageCode: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  audioConfig: z
    .object({
      audioEncoding: z.enum(['MP3', 'OGG_OPUS', 'LINEAR16']).optional(),
      speakingRate: z.number().optional(),
      pitch: z.number().optional(),
      volumeGainDb: z.number().optional(),
    })
    .optional(),
});

/**
 * @openapi
 * /api/v1/media/speech-to-text:
 *   post:
 *     summary: Transcribe audio to text
 *     tags: [Media]
 */
export const speechToText = asyncHandler(async (req: AuthRequest, res: Response) => {
  const params = speechToTextSchema.parse(req.body);

  logger.info('Speech to text request', {
    userId: req.user?.id,
    encoding: params.encoding,
  });

  const result = await mediaService.transcribe(params);

  res.json({
    status: 'success',
    data: result,
  });
});

/**
 * @openapi
 * /api/v1/media/text-to-speech:
 *   post:
 *     summary: Synthesize speech from text
 *     tags: [Media]
 */
export const textToSpeech = asyncHandler(async (req: AuthRequest, res: Response) => {
  const params = textToSpeechSchema.parse(req.body);

  logger.info('Text to speech request', {
    userId: req.user?.id,
    hasVoice: !!params.voice,
  });

  const result = await mediaService.synthesize(params);

  res.json({
    status: 'success',
    data: result,
  });
});
