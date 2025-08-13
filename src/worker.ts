import { handleRequest } from './index.js';

// Cloudflare Worker fetch handler
export default {
  async fetch(request: Request, env: any, _ctx: any): Promise<Response> {
    // Set environment variables from Cloudflare secrets
    if (env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = env.GOOGLE_CLOUD_PROJECT;
    if (env.GOOGLE_APPLICATION_CREDENTIALS)
      process.env.GOOGLE_APPLICATION_CREDENTIALS = env.GOOGLE_APPLICATION_CREDENTIALS;
    if (env.VERTEX_AI_LOCATION) process.env.VERTEX_AI_LOCATION = env.VERTEX_AI_LOCATION;
    if (env.GENKIT_MODEL) process.env.GENKIT_MODEL = env.GENKIT_MODEL;
    if (env.API_KEY) process.env.API_KEY = env.API_KEY;

    // Mark as Cloudflare Worker environment
    process.env.CLOUDFLARE_WORKER = 'true';

    try {
      return await handleRequest(request);
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Internal server error',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  },
};
