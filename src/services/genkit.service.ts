import { genkit, z } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';
import { config } from '@/config/index';
import { logger } from '@/utils/logger';
import { ExternalServiceError } from '@/utils/errors';
import googleAI from '@genkit-ai/googleai';

// Initialize Genkit
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: config.GEMINI_API_KEY,
    }),
    vertexAI({
      projectId: config.GOOGLE_CLOUD_PROJECT,
      location: config.VERTEX_AI_LOCATION,
    }),
  ],
});

export interface CompletionParams {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
}

export class GenkitService {
  async *streamCompletion(params: CompletionParams): AsyncGenerator<string, void, unknown> {
    try {
      logger.info('Starting streaming completion', {
        model: config.GENKIT_MODEL,
        promptLength: params.prompt.length,
      });

      const { stream } = ai.generateStream({
        model: config.GENKIT_MODEL,
        ...(params.systemPrompt ? { system: params.systemPrompt } : {}),
        messages: [{ role: 'user' as const, content: [{ text: params.prompt }] }],
        config: {
          maxOutputTokens: params.maxTokens || 1024,
          temperature: params.temperature || 0.7,
          topP: params.topP || 0.9,
          topK: params.topK || 40,
          stopSequences: params.stopSequences,
        },
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      logger.error('Error in streaming completion:', error);
      throw new ExternalServiceError(
        `Failed to generate completion: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async generateCompletion(params: CompletionParams): Promise<{
    text: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    metadata: any;
  }> {
    try {
      logger.info('Generating completion', {
        model: config.GENKIT_MODEL,
        promptLength: params.prompt.length,
      });

      const response = await ai.generate({
        model: config.GENKIT_MODEL,
        prompt: params.prompt,
        system: params.systemPrompt,
        config: {
          maxOutputTokens: params.maxTokens || 1024,
          temperature: params.temperature || 0.7,
          topP: params.topP || 0.9,
          topK: params.topK || 40,
          stopSequences: params.stopSequences,
        },
      });

      return {
        text: response.text,
        usage: {
          promptTokens: response.usage?.inputTokens || 0,
          completionTokens: response.usage?.outputTokens || 0,
          totalTokens: (response.usage?.inputTokens || 0) + (response.usage?.outputTokens || 0),
        },
        metadata: {
          model: config.GENKIT_MODEL,
          finishReason: response.finishReason,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error generating completion:', error);
      throw new ExternalServiceError(
        `Failed to generate completion: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Define a flow for more complex operations
  defineCompletionFlow() {
    return ai.defineFlow(
      {
        name: 'completionFlow',
        inputSchema: z.object({
          prompt: z.string(),
          systemPrompt: z.string().optional(),
          maxTokens: z.number().optional(),
          temperature: z.number().optional(),
        }),
        outputSchema: z.object({
          text: z.string(),
          usage: z.object({
            promptTokens: z.number(),
            completionTokens: z.number(),
            totalTokens: z.number(),
          }),
        }),
      },
      async (input: {
        prompt: string;
        systemPrompt?: string;
        maxTokens?: number;
        temperature?: number;
      }) => {
        const response = await this.generateCompletion(input);
        return {
          text: response.text,
          usage: response.usage,
        };
      }
    );
  }
}

export const genkitService = new GenkitService();
