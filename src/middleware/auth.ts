import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/index.js';
import { AuthenticationError, AuthorizationError } from '@/utils/errors.js';
import { initDb } from '@/db/sqlite.js';
import { authService } from '@/services/auth.service.js';

export interface AuthRequest extends Request {
	user?: {
		id: string;
		email?: string;
		token: string;
		scopes?: string[];
		isAdmin?: boolean;
	};
}

initDb();

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
	try {
		// Support local dev without token
		if (config.NODE_ENV === 'development' && !config.ACCESS_TOKEN) {
			req.user = { id: 'dev-user', token: 'dev-token', scopes: ['*'], isAdmin: true };
			return next();
		}

		const authHeader = req.headers['authorization'];
		const token = authHeader?.startsWith('Bearer ')
			? authHeader.substring('Bearer '.length).trim()
			: undefined;

		if (!token) {
			throw new AuthenticationError('Missing access token');
		}

		// First check DB-backed tokens
		const dbToken = authService.findTokenByValue(token);
		if (dbToken) {
			req.user = {
				id: dbToken.user_id,
				email: dbToken.email,
				token,
				scopes: dbToken.apis.split(',').map((s) => s.trim()),
				isAdmin: false,
			};
			return next();
		}

		// Fallback to static ACCESS_TOKEN for backward compatibility
		if (config.ACCESS_TOKEN && token === config.ACCESS_TOKEN) {
			req.user = {
				id: 'static-token-user',
				token,
				scopes: ['*'],
				isAdmin: true,
			};
			return next();
		}

		throw new AuthenticationError('Invalid access token');
	} catch (error) {
		next(error);
	}
};

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
	const authHeader = req.headers['authorization'];
	const token = authHeader?.startsWith('Bearer ')
		? authHeader.substring('Bearer '.length).trim()
		: undefined;

	if (token) {
		const dbToken = authService.findTokenByValue(token);
		if (dbToken) {
			req.user = {
				id: dbToken.user_id,
				email: dbToken.email,
				token,
				scopes: dbToken.apis.split(',').map((s) => s.trim()),
				isAdmin: false,
			};
		} else if (config.ACCESS_TOKEN && token === config.ACCESS_TOKEN) {
			req.user = {
				id: 'static-token-user',
				token,
				scopes: ['*'],
				isAdmin: true,
			};
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
	// Admins are either static ACCESS_TOKEN users or have X-Admin-Key header
	const adminHeader = req.headers['x-admin-key'];
	const hasAdminHeader = typeof adminHeader === 'string' && adminHeader.length > 0 && adminHeader === process.env.API_KEY;
	if (req.user?.isAdmin || hasAdminHeader) {
		return next();
	}
	next(new AuthorizationError('Admin access required'));
};
