import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from '@/utils/errors.js';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate = (schema: z.ZodSchema, target: ValidationTarget = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const validated = schema.parse(data);
      req[target] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new ValidationError(`Validation failed: ${JSON.stringify(errors)}`));
      } else {
        next(error);
      }
    }
  };
};

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(10),
});

export const idSchema = z.object({
  id: z.string().uuid(),
});

export const fileUploadSchema = z.object({
  mimetype: z.string(),
  size: z.number().max(50 * 1024 * 1024), // 50MB max
});
