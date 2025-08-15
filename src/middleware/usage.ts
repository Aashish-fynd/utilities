import { Request, Response, NextFunction } from 'express';
import { UsageLog } from '@/models/UsageLog';

export const usageLogger = () => {
  return (req: Request & { user?: any }, res: Response, next: NextFunction): void => {
    const start = Date.now();
    res.on('finish', () => {
      try {
        const durationMs = Date.now() - start;
        const user = req.user;
        const routePath = `${req.baseUrl || ''}${req.path || ''}` || req.originalUrl;
        UsageLog.create({
          userId: user?.id,
          tokenId: user?.tokenId,
          route: routePath,
          method: req.method,
          statusCode: res.statusCode || 200,
          ip: req.ip,
          userAgent: req.get('user-agent') || undefined,
          durationMs,
        }).catch(() => {});
      } catch {
        // ignore logging errors
      }
    });
    next();
  };
};