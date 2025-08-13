import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger.js';
import { ExternalServiceError } from '@/utils/errors.js';
import { ai } from '@/services/genkit.service.js';
import { config } from '@/config/index.js';

export interface TranscribeParams {
  audio: string; // base64
  encoding: 'LINEAR16' | 'MP3' | 'OGG_OPUS' | 'MULAW' | 'ALAW';
  sampleRateHertz: number;
  languageCode?: string;
}

export interface SynthesizeParams {
  text: string;
  voice?: { languageCode?: string; name?: string };
  audioConfig?: {
    audioEncoding?: 'MP3' | 'OGG_OPUS' | 'LINEAR16';
    speakingRate?: number;
    pitch?: number;
    volumeGainDb?: number;
  };
}

function encodingToMime(encoding: string): string {
  switch (encoding) {
    case 'OGG_OPUS':
      return 'audio/ogg; codecs=opus';
    case 'LINEAR16':
      return 'audio/wav';
    case 'MULAW':
      return 'audio/basic';
    case 'ALAW':
      return 'audio/PCMA';
    case 'MP3':
    default:
      return 'audio/mpeg';
  }
}

export class MediaService {
  async transcribe(params: TranscribeParams): Promise<{ id: string; text: string; alternatives: Array<{ text: string; confidence?: number }>; metadata: any }>{
    try {
      const mimeType = encodingToMime(params.encoding);
      const audioBuffer = Buffer.from(params.audio, 'base64');

      logger.info('Transcribing via Genkit', { model: config.GENKIT_MODEL, mimeType });

      const response: any = await ai.generate({
        model: config.GENKIT_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { inlineData: { mimeType, data: audioBuffer } },
              { text: `Transcribe the provided audio to plain ${params.languageCode || 'English'} text.` },
            ],
          },
        ],
        config: {
          // Some models accept these hints; tolerated if ignored
          temperature: 0.2,
        } as any,
      } as any);

      const bestText = response?.text || response?.output?.[0]?.text || '';
      const alternatives: Array<{ text: string; confidence?: number }> = bestText
        ? [{ text: bestText }]
        : [];

      const id = uuidv4();
      return {
        id,
        text: bestText,
        alternatives,
        metadata: {
          provider: 'genkit',
          model: config.GENKIT_MODEL,
          service: 'speech-to-text',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Genkit STT error:', error);
      throw new ExternalServiceError(
        `Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async synthesize(params: SynthesizeParams): Promise<{ id: string; audioContent: string; mimeType: string; metadata: any }>{
    try {
      const desiredEncoding = params.audioConfig?.audioEncoding || 'MP3';
      const mimeType = encodingToMime(desiredEncoding);

      logger.info('Synthesizing via Genkit', { model: config.GENKIT_MODEL, mimeType });

      const response: any = await ai.generate({
        model: config.GENKIT_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { text: `Synthesize natural speech for the following text.` },
              { text: params.text },
            ],
          },
        ],
        config: {
          responseMimeType: mimeType,
        } as any,
      } as any);

      // Attempt to locate audio bytes in common Genkit response shapes
      const inlineData = response?.media?.[0] ||
        response?.output?.[0]?.media?.[0] ||
        response?.candidates?.[0]?.content?.parts?.find((p: any) => p?.inlineData)?.inlineData;

      const audioBuffer: Buffer | undefined = inlineData?.data instanceof Buffer
        ? inlineData.data
        : inlineData?.data
        ? Buffer.from(inlineData.data)
        : undefined;

      const audioContent = audioBuffer ? audioBuffer.toString('base64') : '';

      const id = uuidv4();
      return {
        id,
        audioContent,
        mimeType,
        metadata: {
          provider: 'genkit',
          model: config.GENKIT_MODEL,
          service: 'text-to-speech',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Genkit TTS error:', error);
      throw new ExternalServiceError(
        `Failed to synthesize speech: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export const mediaService = new MediaService();