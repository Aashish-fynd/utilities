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
  GOOGLE_CLOUD_PROJECT: z.string(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

  // Vertex AI
  VERTEX_AI_LOCATION: z.string().default('us-central1'),
  VERTEX_AI_ENDPOINT: z.string().optional(),

  // Genkit
  GENKIT_MODEL: z.string().default('gemini-1.5-pro'),

  // Server
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Auth (legacy static token support)
  ACCESS_TOKEN: z.string().optional(),
  API_KEY: z.string().optional(),

  // Database (MongoDB)
  MONGODB_URI: z.string().default('mongodb://localhost:27017/vertex_ai_utilities'),

  // JWT & Token Lifetimes
  JWT_ACCESS_SECRET: z.string().default('dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-change-me'),
  ACCESS_TOKEN_TTL_MINUTES: z.string().default('15').transform(Number),
  REFRESH_TOKEN_TTL_DAYS: z.string().default('90').transform(Number), // default 3 months
  REFRESH_TOKEN_MAX_DAYS: z.string().default('90').transform(Number), // max 3 months

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Docs
  SWAGGER_SERVER_URL: z.string().optional(),
  GEMINI_API_KEY: z.string(),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('Invalid environment variables:', error);
    process.exit(1);
  }
};

export const config = parseEnv();

export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
export const isStaging = config.NODE_ENV === 'staging';
