import { Router } from 'express';
import { authenticate, requireScope } from '@/middleware/auth.js';
import * as mediaController from '@/controllers/media.controller.js';

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
 *     tags: [Media]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [audio, encoding, sampleRateHertz]
 *             properties:
 *               audio:
 *                 type: string
 *                 description: Base64-encoded audio bytes
 *               encoding:
 *                 type: string
 *                 enum: [LINEAR16, MP3, OGG_OPUS, MULAW, ALAW]
 *               sampleRateHertz:
 *                 type: integer
 *                 example: 16000
 *               languageCode:
 *                 type: string
 *                 example: en-US
 *     responses:
 *       200:
 *         description: Transcription result
 *       400:
 *         description: Invalid input
 */
router.post('/speech-to-text', mediaController.speechToText);

/**
 * @openapi
 * /api/v1/media/text-to-speech:
 *   post:
 *     summary: Synthesize speech from text
 *     tags: [Media]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *               voice:
 *                 type: object
 *                 properties:
 *                   languageCode:
 *                     type: string
 *                     example: en-US
 *                   name:
 *                     type: string
 *                     example: en-US-Neural2-D
 *               audioConfig:
 *                 type: object
 *                 properties:
 *                   audioEncoding:
 *                     type: string
 *                     enum: [MP3, OGG_OPUS, LINEAR16]
 *               uploadToCloudinary:
 *                 type: boolean
 *                 description: When true, upload the generated audio and return only the Cloudinary URL
 *               cloudinaryFolder:
 *                 type: string
 *                 description: Optional Cloudinary folder to upload into
 *     responses:
 *       200:
 *         description: Synthesized audio or URL when uploaded to Cloudinary
 *       400:
 *         description: Invalid input
 */
router.post('/text-to-speech', mediaController.textToSpeech);

export default router;
