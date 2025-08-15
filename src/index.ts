import express, { Express } from 'express';
import type { RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config, isProduction } from '@/config/index';
import { logger } from '@/utils/logger';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import routes from '@/routes/index';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@/utils/swagger';
import { connectDb } from '@/db/mongoose';

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
