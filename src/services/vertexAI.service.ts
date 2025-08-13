import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { google } from '@google-cloud/aiplatform/build/protos/protos.js';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { ExternalServiceError } from '../utils/errors.js';

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
  private predictionClient: PredictionServiceClient;
  private projectId: string;
  private location: string;

  constructor() {
    this.projectId = config.GOOGLE_CLOUD_PROJECT;
    this.location = config.VERTEX_AI_LOCATION;
    
    this.predictionClient = new PredictionServiceClient({
      apiEndpoint: config.VERTEX_AI_ENDPOINT || `${this.location}-aiplatform.googleapis.com`,
    });
  }

  async generateImage(params: ImageGenerationParams): Promise<{
    id: string;
    images: Array<{ url: string; base64: string }>;
    metadata: any;
  }> {
    try {
      const endpoint = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/imagegeneration@006`;
      
      const instances = [
        {
          prompt: params.prompt,
          ...(params.negativePrompt && { negativePrompt: params.negativePrompt }),
        },
      ];

      const parameters = {
        sampleCount: params.numImages || 1,
        aspectRatio: this.getAspectRatio(params.width, params.height),
        guidanceScale: params.guidanceScale || 7.5,
        ...(params.seed && { seed: params.seed }),
      };

      const request = {
        endpoint,
        instances: instances.map((instance) => 
          google.protobuf.Value.fromObject(instance)
        ),
        parameters: google.protobuf.Value.fromObject(parameters),
      };

      logger.info('Generating image with Vertex AI', { params });
      const [response] = await this.predictionClient.predict(request);

      if (!response.predictions || response.predictions.length === 0) {
        throw new ExternalServiceError('No predictions returned from Vertex AI');
      }

      const predictions = response.predictions.map((pred: any) => {
        const obj = pred.structValue?.fields || {};
        return {
          base64: obj.bytesBase64Encoded?.stringValue || '',
          mimeType: obj.mimeType?.stringValue || 'image/png',
        };
      });

      const id = uuidv4();
      const images = predictions.map((pred: any) => ({
        url: `data:${pred.mimeType};base64,${pred.base64}`,
        base64: pred.base64,
      }));

      return {
        id,
        images,
        metadata: {
          model: 'imagegeneration@006',
          parameters,
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
      
      const endpoint = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/imagen-video@001`;
      
      if (!params.image) {
        throw new Error('Image is required for image-to-video generation');
      }

      const instances = [{
        image: {
          bytesBase64Encoded: params.image,
        },
        ...(params.prompt && { prompt: params.prompt }),
      }];

      const parameters = {
        frameRate: params.fps || 24,
        duration: params.duration || 4,
        aspectRatio: this.getAspectRatio(params.width, params.height),
      };

      const request = {
        endpoint,
        instances: instances.map((instance) => 
          google.protobuf.Value.fromObject(instance)
        ),
        parameters: google.protobuf.Value.fromObject(parameters),
      };

      logger.info('Generating video from image with Vertex AI', { params });
      const [response] = await this.predictionClient.predict(request);

      if (!response.predictions || response.predictions.length === 0) {
        throw new ExternalServiceError('No predictions returned from Vertex AI');
      }

      const prediction = response.predictions[0];
      const videoBase64 = prediction.structValue?.fields?.bytesBase64Encoded?.stringValue || '';
      
      const id = uuidv4();
      return {
        id,
        videoUrl: `data:video/mp4;base64,${videoBase64}`,
        metadata: {
          model: 'imagen-video@001',
          parameters,
          timestamp: new Date().toISOString(),
        },
      };
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
      
      const endpoint = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/text-to-video@001`;
      
      if (!params.prompt) {
        throw new Error('Prompt is required for text-to-video generation');
      }

      const instances = [{
        prompt: params.prompt,
      }];

      const parameters = {
        frameRate: params.fps || 24,
        duration: params.duration || 4,
        aspectRatio: this.getAspectRatio(params.width, params.height),
      };

      const request = {
        endpoint,
        instances: instances.map((instance) => 
          google.protobuf.Value.fromObject(instance)
        ),
        parameters: google.protobuf.Value.fromObject(parameters),
      };

      logger.info('Generating video from text with Vertex AI', { params });
      const [response] = await this.predictionClient.predict(request);

      if (!response.predictions || response.predictions.length === 0) {
        throw new ExternalServiceError('No predictions returned from Vertex AI');
      }

      const prediction = response.predictions[0];
      const videoBase64 = prediction.structValue?.fields?.bytesBase64Encoded?.stringValue || '';
      
      const id = uuidv4();
      return {
        id,
        videoUrl: `data:video/mp4;base64,${videoBase64}`,
        metadata: {
          model: 'text-to-video@001',
          parameters,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error generating video from text:', error);
      throw new ExternalServiceError(
        `Failed to generate video from text: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private getAspectRatio(width?: number, height?: number): string {
    if (!width || !height) return '1:1';
    
    const ratio = width / height;
    if (Math.abs(ratio - 1) < 0.1) return '1:1';
    if (Math.abs(ratio - 16/9) < 0.1) return '16:9';
    if (Math.abs(ratio - 9/16) < 0.1) return '9:16';
    if (Math.abs(ratio - 4/3) < 0.1) return '4:3';
    
    return '1:1';
  }
}

export const vertexAIService = new VertexAIService();