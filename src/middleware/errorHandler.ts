import { NextFunction, Request, Response } from 'express';
import { AppError } from '@/utils/errors.js';
import { isProduction } from '@/config/index.js';

export const asyncHandler = <T extends Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<void | any>) => {
	return (req: T, res: Response, next: NextFunction) => {
		fn(req, res, next).catch(next);
	};
};

export const notFoundHandler = (_req: Request, res: Response) => {
	res.status(404).json({ status: 'error', message: 'Not Found' });
};

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
	if (err instanceof AppError) {
		res.status(err.statusCode).json({ status: 'error', message: err.message, ...(err.details ? { details: err.details } : {}) });
		return;
	}
	// Unknown error fallback
	const status = typeof err?.status === 'number' ? err.status : 500;
	const message = err?.message || 'Internal server error';
	res.status(status).json({ status: 'error', message, ...(isProduction ? {} : { stack: err?.stack }) });
};
