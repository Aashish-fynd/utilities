import { Request, Response, RequestHandler } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@/middleware/errorHandler.js';
import { AuthRequest } from '@/middleware/auth.js';
import { logger } from '@/utils/logger.js';
import { mediaService } from '@/services/media.service.js';

const speechToTextSchema = z.object({
	audio: z.string().min(1), // base64
	encoding: z.enum(['LINEAR16', 'MP3', 'OGG_OPUS', 'MULAW', 'ALAW']),
	sampleRateHertz: z.number().int().min(8000).max(48000),
	languageCode: z.string().default('en-US'),
});

const textToSpeechSchema = z.object({
	text: z.string().min(1).max(5000),
	voice: z
		.object({
			languageCode: z.string().default('en-US'),
			name: z.string().optional(),
		})
		.optional(),
	audioConfig: z
		.object({
			audioEncoding: z.enum(['MP3', 'OGG_OPUS', 'LINEAR16']).default('MP3'),
			speakingRate: z.number().min(0.25).max(4).optional(),
			pitch: z.number().min(-20).max(20).optional(),
			volumeGainDb: z.number().min(-96).max(16).optional(),
		})
		.optional(),
});

/**
 * Transcribe base64-encoded audio to text using Google Cloud Speech-to-Text.
 */
export const speechToText = asyncHandler(async (req: AuthRequest, res: Response) => {
	const params = speechToTextSchema.parse(req.body);
	logger.info('Speech-to-text request', {
		userId: req.user?.id,
		sampleRateHertz: params.sampleRateHertz,
		languageCode: params.languageCode,
	});

	const result = await mediaService.transcribe(params);
	res.json({ status: 'success', data: result });
});

/**
 * Synthesize speech from text using Google Cloud Text-to-Speech.
 */
export const textToSpeech = asyncHandler(async (req: AuthRequest, res: Response) => {
	const params = textToSpeechSchema.parse(req.body);
	logger.info('Text-to-speech request', {
		userId: req.user?.id,
		textLength: params.text.length,
	});

	const result = await mediaService.synthesize(params);
	res.json({ status: 'success', data: result });
});

// Health check endpoint for Media
export const checkMediaHealth: RequestHandler = asyncHandler(async (_req: Request, res: Response) => {
	res.json({
		status: 'success',
		service: 'media',
		healthy: true,
		timestamp: new Date().toISOString(),
	});
});