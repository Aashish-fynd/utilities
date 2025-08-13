import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';
// Avoid importing internal protobuf modules; send plain objects
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/config/index.js';
import { logger } from '@/utils/logger.js';
import { ExternalServiceError } from '@/utils/errors.js';

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

const ai = genkit({
  plugins: [
    vertexAI({
      projectId: config.GOOGLE_CLOUD_PROJECT,
      location: config.VERTEX_AI_LOCATION,
    }),
  ],
});

export class VertexAIService {
  async generateImage(params: ImageGenerationParams): Promise<{
    id: string;
    images: Array<{ url: string; base64: string }>;
    metadata: any;
  }> {
    try {
      logger.info('Generating image with Vertex AI (Genkit)', { params });

      const response = await ai.generate({
        model: vertexAI.model('imagen-3.0-generate-002'),
        prompt: params.prompt,
        output: { format: 'media' },
      });

      if (!response.media?.url) {
        throw new ExternalServiceError('No media returned from Imagen');
      }

      const id = uuidv4();
      const images = [
        {
          url: response.media.url,
          base64: response.media.url.split(',')[1] || '',
        },
      ];

      return {
        id,
        images,
        metadata: {
          model: 'imagen-3.0-generate-002',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error generating image:', error);
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
      // Note: As of now, Vertex AI doesn't have a direct image-to-video model
      // This is a placeholder for when the functionality becomes available
      // You might need to use a different service or wait for the feature

      // Not implemented via Genkit Vertex AI plugin yet

      if (!params.image) {
        throw new Error('Image is required for image-to-video generation');
      }

      // kept local variables earlier; not used anymore

      throw new ExternalServiceError('image2video is not implemented via Genkit Vertex AI');
    } catch (error) {
      logger.error('Error generating video from image:', error);
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
      // Note: Direct text-to-video might not be available yet in Vertex AI
      // This is a placeholder implementation

      // Not implemented via Genkit Vertex AI plugin yet

      if (!params.prompt) {
        throw new Error('Prompt is required for text-to-video generation');
      }

      // kept local variables earlier; not used anymore

      throw new ExternalServiceError('text2video is not implemented via Genkit Vertex AI');
    } catch (error) {
      logger.error('Error generating video from text:', error);
      throw new ExternalServiceError(
        `Failed to generate video from text: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // aspect ratio helper not used now; kept for future video features
}

export const vertexAIService = new VertexAIService();
