import { Request, Response } from 'express';
import { UsageLog } from '@/models/UsageLog';

interface UsageLogData {
  req: Request & { user?: any };
  res: Response;
  data?: any;
}

// Manual usage logging function
export const logUsage = async (data: UsageLogData): Promise<void> => {
  try {
    const durationMs = Date.now() - (data.req as any)?.startTime;
    const user = data.req.user;
    const routePath = `${data.req.baseUrl || ''}${data.req.path || ''}` || data.req.originalUrl;

    await UsageLog.create({
      userId: user?.id,
      tokenId: user?.tokenId,
      route: routePath,
      method: data.req.method,
      statusCode: data.res.statusCode || 200,
      ip: data.req.ip,
      userAgent: data.req.get('user-agent') || undefined,
      durationMs,
      ...(data.data || {}),
    });
  } catch {
    // ignore logging errors
  }
};
