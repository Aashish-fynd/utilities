import { randomUUID } from 'crypto';
import { logger } from '@/utils/logger';
import { ExternalServiceError } from '@/utils/errors';
import { ai } from '@/services/genkit.service';
import { config } from '@/config/index';
import vertexAI from '@genkit-ai/vertexai';

interface ImageGenerationParams {
  prompt: string;
  sampleCount?: number;
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

interface AIGenerateResponse {
  bytesBase64Encoded: string;
  mimeType: string;
  prompt: string;
}

export class VertexAIService {
  private getBaseUrl(model: string) {
    return `https://${config.VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${config.GOOGLE_CLOUD_PROJECT}/locations/${config.VERTEX_AI_LOCATION}/publishers/google/models/${model}:predict`;
  }

  async generateImage(params: ImageGenerationParams): Promise<{
    id: string;
    images: Array<{ base64: string; mimeType: string }>;
    metadata: any;
    output: Record<string, any>;
  }> {
    try {
      // const response = await axios.post(
      //   this.getBaseUrl(params.model),
      //   {
      //     instances: [
      //       {
      //         prompt: params.prompt,
      //       },
      //     ],
      //     parameters: {
      //       sampleCount: params.numImages || 1,
      //     },
      //   },
      //   {
      //     headers: {
      //       'Content-Type': 'application/json',
      //       Authorization: `Bearer ${config.GOOGLE_APPLICATION_CREDENTIALS}`,
      //     },
      //   }
      // );

      const { custom } = await ai.generate({
        model: vertexAI.model(params.model), // valid Imagen 3 ID
        output: { format: 'png' },
        prompt: params.prompt,
        config: {
          numberOfImages: params.sampleCount || 1,
        },
      });

      const predictions = (custom as { predictions: AIGenerateResponse[] })?.predictions;
      if (!predictions || !predictions.length) {
        throw new ExternalServiceError('Not able to generate images');
      }

      const id = randomUUID();
      return {
        id,
        images: predictions.map((p: AIGenerateResponse) => ({
          base64: p.bytesBase64Encoded,
          mimeType: p.mimeType,
        })),
        metadata: {
          model: params.model,
          width: params.width,
          height: params.height,
          timestamp: new Date().toISOString(),
        },
        output: { usage: (custom as { usage: any })?.usage },
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
    output: Record<string, any>;
  }> {
    try {
      if (!params.image) {
        throw new ExternalServiceError('Image is required for image-to-video generation');
      }

      const imageBuffer = Buffer.from(params.image, 'base64');

      const response: any = await ai.generate({
        // Placeholder model; depends on availability
        model: vertexAI.model(params.model),
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
        output: { usage: (response.custom as { usage: any })?.usage },
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
    output: Record<string, any>;
  }> {
    try {
      if (!params.prompt) {
        throw new ExternalServiceError('Prompt is required for text-to-video generation');
      }

      const { custom } = await ai.generate({
        model: vertexAI.model(params.model), // valid Imagen 3 ID
        output: { format: 'mp4' },
        prompt: params.prompt,
        // config: {
        //   aspectRatio: '16:9',
        //   personGeneration: 'allow_all',
        //   // negativePrompt,
        //   // image
        // },
      });

      // const response: any = await axios.post(this.getBaseUrl(params.model), {
      //   instances: [
      //     {
      //       prompt: params.prompt,
      //     },
      //   ],
      //   parameters: {
      //     sampleCount: params.sampleCount || 1,
      //   },
      // });

      const media = (custom as { media: any[] })?.media?.[0];
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
        output: { usage: (custom as { usage: any })?.usage },
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
