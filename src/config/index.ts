import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from .env file if it exists
// For Cloudflare Workers, environment variables are set differently
if (process.env.NODE_ENV !== 'production' || !process.env.CLOUDFLARE_WORKER) {
  // Try to load .env file from project root
  const envPath = path.resolve(process.cwd(), '.env');
  dotenv.config({ path: envPath });

  // Also try to load .env.local for local development
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envLocalPath, override: true });
}

const envSchema = z.object({
  // Google Cloud
  GOOGLE_CLOUD_PROJECT: z.string().min(1, 'GOOGLE_CLOUD_PROJECT is required'),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

  // Vertex AI
  VERTEX_AI_LOCATION: z.string().default('us-central1'),
  VERTEX_AI_ENDPOINT: z.string().optional(),

  // Genkit
  GENKIT_MODEL: z.string().default('gemini-1.5-pro'),

  // Server
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // API Security
  API_KEY: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // CORS
  ALLOWED_ORIGINS: z.string().optional(),
});

const parseEnv = () => {
  try {
    const result = envSchema.parse(process.env);

    return result;
  } catch (error) {
    console.error('❌ Environment configuration error:');

    if (error instanceof z.ZodError) {
      console.error('Missing or invalid environment variables:');
      console.error('Error details:', error.message);
    } else {
      console.error('Unexpected error:', error);
    }

    process.exit(1);
  }
};

export const config = parseEnv();

export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
export const isStaging = config.NODE_ENV === 'staging';
