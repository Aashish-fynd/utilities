import winston from 'winston';
import { config } from '@/config/index.js';

/**
 * Application logger configured with winston.
 * Logs to console in development and to files in production.
 */
export const logger = winston.createLogger({
	level: config.LOG_LEVEL,
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.errors({ stack: true }),
		winston.format.json()
	),
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple()
			),
		}),
	],
});

// Create a stream object with a 'write' function for Morgan
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
