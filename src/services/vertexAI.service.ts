import { randomUUID } from 'crypto';
import { logger } from '@/utils/logger.js';
import { ExternalServiceError } from '@/utils/errors.js';
import { ai } from '@/services/genkit.service.js';
import { config } from '@/config/index.js';
import axios from 'axios';

interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  numImages?: number;
  width?: number;
  height?: number;
  model: string;
}

interface VideoGenerationParams {
  prompt?: string;
  image?: string; // base64 encoded image for image2video
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
  model: string;
  sampleCount?: number;
}

export class VertexAIService {
  private getBaseUrl(model: string) {
    return `https://${config.VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${config.GOOGLE_CLOUD_PROJECT}/locations/${config.VERTEX_AI_LOCATION}/publishers/google/models/${model}:predict`;
  }

  async generateImage(params: ImageGenerationParams): Promise<{
    id: string;
    images: Array<{ url: string; base64: string }>;
    metadata: any;
  }> {
    try {
      const response = await axios.post(
        this.getBaseUrl(params.model),
        {
          instances: [
            {
              prompt: params.prompt,
            },
          ],
          parameters: {
            sampleCount: params.numImages || 1,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.GOOGLE_APPLICATION_CREDENTIALS}`,
          },
        }
      );

      const predictions = response.data.predictions;

      const id = randomUUID();
      return {
        id,
        images: predictions,
        metadata: {
          model: params.model,
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
      const buf: Buffer | undefined =
        media?.data instanceof Buffer
          ? media.data
          : media?.data
            ? Buffer.from(media.data)
            : undefined;
      const videoBase64 = buf ? buf.toString('base64') : '';

      const id = randomUUID();
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

      const response: any = await axios.post(this.getBaseUrl(params.model), {
        instances: [
          {
            prompt: params.prompt,
          },
        ],
        parameters: {
          sampleCount: params.sampleCount || 1,
        },
      });

      const media = response?.media?.[0] || response?.output?.[0]?.media?.[0];
      const buf: Buffer | undefined =
        media?.data instanceof Buffer
          ? media.data
          : media?.data
            ? Buffer.from(media.data)
            : undefined;
      const videoBase64 = buf ? buf.toString('base64') : '';

      const id = randomUUID();
      return {
        id,
        videoUrl: `data:video/mp4;base64,${videoBase64}`,
        metadata: {
          model: params.model,
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
