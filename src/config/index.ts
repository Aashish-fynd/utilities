import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from .env files in non-production
if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(process.cwd(), '.env');
  dotenv.config({ path: envPath });

  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envLocalPath, override: true });
}

const envSchema = z.object({
  // Google Cloud
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
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
  MONGODB_URI: z.string(),
  MONGODB_DB_NAME: z.string(),

  // JWT & Token Lifetimes
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
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

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  CLOUDINARY_FOLDER: z.string(),

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
