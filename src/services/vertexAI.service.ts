import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger.js';
import { ExternalServiceError } from '@/utils/errors.js';
import { ai } from '@/services/genkit.service.js';

interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  numImages?: number;
  width?: number;
  height?: number;
  guidanceScale?: number;
  seed?: number;
}

interface VideoGenerationParams {
  prompt?: string;
  image?: string; // base64 encoded image for image2video
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
}

export class VertexAIService {
  constructor() {}

  async generateImage(params: ImageGenerationParams): Promise<{
    id: string;
    images: Array<{ url: string; base64: string }>;
    metadata: any;
  }> {
    try {
      const response: any = await ai.generate({
        // Imagen image model on Vertex
        model: 'imagegeneration@006',
        prompt: params.prompt,
        config: {
          // response as image data
          responseMimeType: 'image/png',
          // Guidance/seed hints if supported
          guidance: params.guidanceScale,
          seed: params.seed,
        } as any,
      } as any);

      // Extract image bytes from Genkit response
      const mediaParts = response?.media || response?.output?.[0]?.media || [];
      const images = (Array.isArray(mediaParts) ? mediaParts : []).map((m: any) => {
        const dataBuf: Buffer | undefined = m?.data instanceof Buffer ? m.data : m?.data ? Buffer.from(m.data) : undefined;
        const base64 = dataBuf ? dataBuf.toString('base64') : '';
        const url = `data:image/png;base64,${base64}`;
        return { url, base64 };
      });

      const id = uuidv4();
      return {
        id,
        images,
        metadata: {
          model: 'imagegeneration@006',
          width: params.width,
          height: params.height,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error generating image (Genkit):', error);
      throw new ExternalServiceError(
        `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async generateVideoFromImage(params: VideoGenerationParams): Promise<{
    id: string;
    videoUrl: string;
    metadata: any;
  }> {
    try {
      if (!params.image) {
        throw new ExternalServiceError('Image is required for image-to-video generation');
      }

      const imageBuffer = Buffer.from(params.image, 'base64');

      const response: any = await ai.generate({
        // Placeholder model; depends on availability
        model: 'imagen-video@001',
        messages: [
          {
            role: 'user',
            content: [
              { inlineData: { mimeType: 'image/png', data: imageBuffer } },
              ...(params.prompt ? [{ text: params.prompt }] : []),
            ],
          },
        ],
        config: {
          responseMimeType: 'video/mp4',
          frameRate: params.fps || 24,
          duration: params.duration || 4,
        } as any,
      } as any);

      const media = response?.media?.[0] || response?.output?.[0]?.media?.[0];
      const buf: Buffer | undefined = media?.data instanceof Buffer ? media.data : media?.data ? Buffer.from(media.data) : undefined;
      const videoBase64 = buf ? buf.toString('base64') : '';

      const id = uuidv4();
      return {
        id,
        videoUrl: `data:video/mp4;base64,${videoBase64}`,
        metadata: {
          model: 'imagen-video@001',
          frameRate: params.fps || 24,
          duration: params.duration || 4,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error generating video from image (Genkit):', error);
      throw new ExternalServiceError(
        `Failed to generate video from image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async generateVideoFromText(params: VideoGenerationParams): Promise<{
    id: string;
    videoUrl: string;
    metadata: any;
  }> {
    try {
      if (!params.prompt) {
        throw new ExternalServiceError('Prompt is required for text-to-video generation');
      }

      const response: any = await ai.generate({
        model: 'text-to-video@001',
        prompt: params.prompt,
        config: {
          responseMimeType: 'video/mp4',
          frameRate: params.fps || 24,
          duration: params.duration || 4,
        } as any,
      } as any);

      const media = response?.media?.[0] || response?.output?.[0]?.media?.[0];
      const buf: Buffer | undefined = media?.data instanceof Buffer ? media.data : media?.data ? Buffer.from(media.data) : undefined;
      const videoBase64 = buf ? buf.toString('base64') : '';

      const id = uuidv4();
      return {
        id,
        videoUrl: `data:video/mp4;base64,${videoBase64}`,
        metadata: {
          model: 'text-to-video@001',
          frameRate: params.fps || 24,
          duration: params.duration || 4,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error generating video from text (Genkit):', error);
      throw new ExternalServiceError(
        `Failed to generate video from text: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export const vertexAIService = new VertexAIService();
