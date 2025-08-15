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
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@/utils/swagger.js';
import { connectDb } from '@/db/mongoose.js';
import { UsageLog } from '@/models/UsageLog.js';

// Create Express app
const app: Express = express();

// Trust proxy if behind proxy
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

// Swagger docs
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Usage logging after response (only generation endpoints)
app.use((req: any, res, next) => {
  const start = Date.now();
  const originalEnd: any = res.end;
  res.end = function (this: any, chunk?: any, encoding?: any) {
    try {
      const durationMs = Date.now() - start;
      const statusCode = res.statusCode || 200;
      const user = (req as any).user;
      const path: string = req.path || '';
      const method: string = req.method || '';
      // Log only generations usage: genkit text and vertex-ai generation endpoints
      const isGeneration = path.startsWith('/api/v1/genkit') || path.startsWith('/api/v1/vertex-ai');
      if (isGeneration) {
        UsageLog.create({
          userId: user?.id ? user.id : undefined,
          tokenId: user?.tokenId ? user.tokenId : undefined,
          route: path,
          method,
          statusCode,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          durationMs,
        }).catch(() => {});
      }
    } catch {
      // ignore logging errors
    }
    return originalEnd.apply(this, [chunk, encoding]);
  } as any;
  next();
});

// Mount routes
app.use(routes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start Node server
(async () => {
  await connectDb();
  const PORT = config.PORT;
  app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });
})();

export default app;
