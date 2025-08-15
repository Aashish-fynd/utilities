import winston from 'winston';
import { config } from '@/config/index';

const level = config.LOG_LEVEL || 'info';

export const logger = winston.createLogger({
  level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${level.toUpperCase()}] ${message}${rest}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

// Create a stream object with a 'write' function for Morgan
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
