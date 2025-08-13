import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/index.js';
import { AuthenticationError } from '@/utils/errors.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    apiKey: string;
  };
}

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    // Skip authentication in development mode if no API key is configured
    if (config.NODE_ENV === 'development' && !config.API_KEY) {
      req.user = { id: 'dev-user', apiKey: 'dev-key' };
      return next();
    }

    const apiKey = (req.headers['x-api-key'] as string) || (req.query.api_key as string);

    if (!apiKey) {
      throw new AuthenticationError('API key is required');
    }

    if (config.API_KEY && apiKey !== config.API_KEY) {
      throw new AuthenticationError('Invalid API key');
    }

    // In a production environment, you might want to validate the API key against a database
    // and retrieve user information
    req.user = {
      id: 'user-' + Date.now(),
      apiKey,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const apiKey = (req.headers['x-api-key'] as string) || (req.query.api_key as string);

  if (apiKey && config.API_KEY && apiKey === config.API_KEY) {
    req.user = {
      id: 'user-' + Date.now(),
      apiKey,
    };
  }

  next();
};
