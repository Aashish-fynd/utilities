import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/index';
import { AuthenticationError, AuthorizationError } from '@/utils/errors';
import jwt from 'jsonwebtoken';
import { Token } from '@/models/Token';
import { User } from '@/models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    token: string;
    scopes?: string[];
    isAdmin?: boolean;
    tokenId?: string;
  };
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // Support local dev without token
    if (config.NODE_ENV === 'development' && !config.ACCESS_TOKEN) {
      req.user = { id: '000000000000000000000000', token: 'dev-token', scopes: ['*'], isAdmin: true };
      return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length).trim()
      : undefined;

    if (!token) {
      throw new AuthenticationError('Missing access token');
    }

    try {
      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as { sub: string; jti: string; scopes: string[] };
      const tokenDoc = await Token.findOne({ jti: decoded.jti, active: true });
      if (!tokenDoc) throw new AuthenticationError('Invalid access token');
      const user = await User.findById(tokenDoc.userId);
      if (!user) throw new AuthenticationError('Invalid access token');

      req.user = {
        id: (user._id as any).toString(),
        email: user.email,
        token,
        scopes: tokenDoc.scopes,
        isAdmin: !!user.isAdmin,
        tokenId: (tokenDoc._id as any).toString(),
      };
      return next();
    } catch {
      throw new AuthenticationError('Invalid access token');
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring('Bearer '.length).trim()
    : undefined;

  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as { sub: string; jti: string; scopes: string[] };
      const tokenDoc = await Token.findOne({ jti: decoded.jti, active: true });
      if (tokenDoc) {
        const user = await User.findById(tokenDoc.userId);
        if (user) {
          req.user = {
            id: (user._id as any).toString(),
            email: user.email,
            token,
            scopes: tokenDoc.scopes,
            isAdmin: !!user.isAdmin,
            tokenId: (tokenDoc._id as any).toString(),
          };
        }
      }
    } catch {
      // ignore
    }
  }

  next();
};

export const requireScope = (requiredScope: string) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const scopes = req.user?.scopes || [];
    if (scopes.includes('*') || scopes.includes(requiredScope)) {
      return next();
    }
    next(new AuthorizationError(`Missing required scope: ${requiredScope}`));
  };
};

export const requireAdmin = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  // Admins are users with isAdmin flag or have X-Admin-Key header
  const adminHeader = req.headers['x-admin-key'];
  const hasAdminHeader =
    typeof adminHeader === 'string' &&
    adminHeader.length > 0 &&
    adminHeader === process.env.ADMIN_USER_KEY;

  if (req.user?.isAdmin || hasAdminHeader) {
    return next();
  }
  next(new AuthorizationError('Admin access required'));
};
