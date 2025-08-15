import { Router } from 'express';
import { authenticate, requireScope } from '@/middleware/auth';
import * as mediaController from '@/controllers/media.controller';

/**
 * @openapi
 * tags:
 *   - name: Media
 *     description: Audio transcription and synthesis endpoints
 */
const router: Router = Router();

// All media routes require authentication
router.use(authenticate);
router.use(requireScope('media'));

/**
 * @openapi
 * /api/v1/media/speech-to-text:
 *   post:
 *     summary: Transcribe audio to text
 *     description: Convert audio speech to text using Google Cloud Speech-to-Text API
 *     tags: [Media]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SpeechToTextRequest'
 *     responses:
 *       200:
 *         description: Transcription successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SpeechToTextResponse'
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
 *         description: Speech transcription failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/speech-to-text', mediaController.speechToText);

/**
 * @openapi
 * /api/v1/media/text-to-speech:
 *   post:
 *     summary: Synthesize speech from text
 *     description: Convert text to natural-sounding speech using Google Cloud Text-to-Speech API
 *     tags: [Media]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TextToSpeechRequest'
 *     responses:
 *       200:
 *         description: Speech synthesis successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TextToSpeechResponse'
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
 *         description: Speech synthesis failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/text-to-speech', mediaController.textToSpeech);

export default router;
