import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors.js';
import { logger } from '@/utils/logger.js';

/**
 * Express error handling middleware that formats known AppError instances
 * and hides sensitive details for unknown errors.
 */
export const errorHandler = (
	err: unknown,
	req: Request,
	res: Response,
	_next: NextFunction
): void => {
	const isAppError = err instanceof AppError;
	const statusCode = isAppError ? err.statusCode : 500;
	const message = isAppError ? err.message : 'Internal server error';

	if (!isAppError) {
		logger.error('Unhandled error', { method: req.method, url: req.url, error: err as any });
	}

	res.status(statusCode).json({ status: 'error', message });
};

/**
 * Express 404 handler for unknown routes.
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
	res.status(404).json({ status: 'error', message: 'Route not found' });
};

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => unknown) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
