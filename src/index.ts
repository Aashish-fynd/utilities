import express, { Express } from 'express';
import type { RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config, isProduction } from '@/config/index.js';
import { logger } from '@/utils/logger.js';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler.js';
import routes from '@/routes/index.js';

// Create Express app
const app: Express = express();

// Trust proxy for Cloudflare
app.set('trust proxy', true);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: isProduction ? process.env.ALLOWED_ORIGINS?.split(',') : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression middleware
app.use(compression() as unknown as RequestHandler);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later.',
    });
  },
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Mount routes
app.use(routes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// For Cloudflare Workers compatibility
let server: any;

if (process.env.NODE_ENV !== 'production' || !process.env.CLOUDFLARE_WORKER) {
  // Traditional Node.js server
  const PORT = config.PORT;
  server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${config.NODE_ENV}`);
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    logger.info('Received shutdown signal, closing server...');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

// Export for Cloudflare Workers
export default app;

// Export handler for Cloudflare Workers
export const handleRequest = async (request: Request): Promise<Response> => {
  // Convert Cloudflare Request to Node.js-like request
  const url = new URL(request.url);
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Create a mock request/response for Express
  const mockReq: any = {
    method: request.method,
    url: url.pathname + url.search,
    headers,
    body: request.method !== 'GET' ? await request.json() : undefined,
  };

  const mockRes: any = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.headers['Content-Type'] = 'application/json';
      this.body = JSON.stringify(data);
    },
    send(data: any) {
      this.body = data;
    },
    write(chunk: any) {
      this.body += chunk;
    },
    end() {
      // No-op for compatibility
    },
  };

  // Process request through Express
  return new Promise((resolve) => {
    app(mockReq, mockRes, () => {
      resolve(
        new Response(mockRes.body, {
          status: mockRes.statusCode,
          headers: mockRes.headers,
        })
      );
    });
  });
};
