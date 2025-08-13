import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/index.js';
import { AuthenticationError } from '@/utils/errors.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    token: string;
  };
}

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    // Support local dev without token
    if (config.NODE_ENV === 'development' && !config.ACCESS_TOKEN) {
      req.user = { id: 'dev-user', token: 'dev-token' };
      return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length).trim()
      : undefined;

    if (!token) {
      throw new AuthenticationError('Missing access token');
    }

    if (config.ACCESS_TOKEN && token !== config.ACCESS_TOKEN) {
      throw new AuthenticationError('Invalid access token');
    }

    req.user = {
      id: 'user-' + Date.now(),
      token,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring('Bearer '.length).trim()
    : undefined;

  if (token && config.ACCESS_TOKEN && token === config.ACCESS_TOKEN) {
    req.user = {
      id: 'user-' + Date.now(),
      token,
    };
  }

  next();
};
