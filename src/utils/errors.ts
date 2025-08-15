export class AppError extends Error {
	statusCode: number;
	isOperational: boolean;
	details?: unknown;

	/**
	 * Represents an application-level error with HTTP status and operational flag.
	 */
	constructor(message: string, statusCode = 500, isOperational = true, details?: unknown) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		this.details = details;
		Object.setPrototypeOf(this, new.target.prototype);
		Error.captureStackTrace?.(this, this.constructor);
	}
}

export class ValidationError extends AppError {
	/**
	 * Input validation error
	 */
	constructor(message: string, details?: unknown) {
		super(message, 400, true, details);
	}
}

export class AuthenticationError extends AppError {
	/**
	 * Authentication failed or missing credentials
	 */
	constructor(message: string) {
		super(message, 401, true);
	}
}

export class AuthorizationError extends AppError {
	constructor(message = 'Access denied') {
		super(message, 403, true);
	}
}

export class NotFoundError extends AppError {
	/**
	 * Resource not found
	 */
	constructor(message: string) {
		super(message, 404, true);
	}
}

export class ConflictError extends AppError {
	constructor(message: string) {
		super(message, 409, true);
	}
}

export class RateLimitError extends AppError {
	constructor(message = 'Too many requests') {
		super(message, 429, true);
	}
}

export class ExternalServiceError extends AppError {
	/**
	 * Error while calling an external provider API
	 */
	constructor(message: string) {
		super(message, 502, true);
	}
}