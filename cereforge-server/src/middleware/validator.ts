import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { Errors } from '../utils/errors';

/**
 * Validate request body against Zod schema
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        next(Errors.validationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate request query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        next(Errors.validationError('Query validation failed', details));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate request params
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        next(Errors.validationError('Parameter validation failed', details));
      } else {
        next(error);
      }
    }
  };
}