import { Request, Response, NextFunction } from 'express';
import logger from './logger';

/**
 * Standard error codes
 */
export enum ErrorCode {
  // Authentication
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  
  // Authorization
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Server
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Business Logic
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_PENDING = 'ACCOUNT_PENDING',
  PARTNER_ALREADY_APPROVED = 'PARTNER_ALREADY_APPROVED',
  PARTNER_ALREADY_REJECTED = 'PARTNER_ALREADY_REJECTED',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: any,
    isOperational = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Pre-defined error creators
 */
export class Errors {
  // 400 Bad Request
  static badRequest(message: string, details?: any): ApiError {
    return new ApiError(400, ErrorCode.INVALID_INPUT, message, details);
  }

  static validationError(message: string, details?: any): ApiError {
    return new ApiError(400, ErrorCode.VALIDATION_ERROR, message, details);
  }

  // 401 Unauthorized
  static unauthorized(message: string = 'Authentication required'): ApiError {
    return new ApiError(401, ErrorCode.UNAUTHORIZED, message);
  }

  static invalidCredentials(): ApiError {
    return new ApiError(401, ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password');
  }

  static tokenExpired(): ApiError {
    return new ApiError(401, ErrorCode.TOKEN_EXPIRED, 'Token has expired');
  }

  static invalidToken(): ApiError {
    return new ApiError(401, ErrorCode.INVALID_TOKEN, 'Invalid or malformed token');
  }

  // 403 Forbidden
  static forbidden(message: string = 'Access denied'): ApiError {
    return new ApiError(403, ErrorCode.FORBIDDEN, message);
  }

  static insufficientPermissions(): ApiError {
    return new ApiError(403, ErrorCode.INSUFFICIENT_PERMISSIONS, 'You do not have permission to perform this action');
  }

  // 404 Not Found
  static notFound(resource: string = 'Resource'): ApiError {
    return new ApiError(404, ErrorCode.NOT_FOUND, `${resource} not found`);
  }

  // 409 Conflict
  static conflict(message: string): ApiError {
    return new ApiError(409, ErrorCode.CONFLICT, message);
  }

  static alreadyExists(resource: string): ApiError {
    return new ApiError(409, ErrorCode.ALREADY_EXISTS, `${resource} already exists`);
  }

  // 429 Too Many Requests
  static tooManyRequests(message: string = 'Too many requests. Please try again later.'): ApiError {
    return new ApiError(429, ErrorCode.RATE_LIMIT_EXCEEDED, message);
  }

  // 500 Internal Server Error
  static internal(message: string = 'An internal server error occurred'): ApiError {
    return new ApiError(500, ErrorCode.INTERNAL_SERVER_ERROR, message, undefined, false);
  }

  static database(message: string = 'Database operation failed'): ApiError {
    return new ApiError(500, ErrorCode.DATABASE_ERROR, message, undefined, false);
  }

  static externalService(service: string): ApiError {
    return new ApiError(500, ErrorCode.EXTERNAL_SERVICE_ERROR, `External service (${service}) is unavailable`, undefined, false);
  }

  // Business Logic Errors
  static accountSuspended(): ApiError {
    return new ApiError(403, ErrorCode.ACCOUNT_SUSPENDED, 'Your account has been suspended. Please contact support.');
  }

  static accountPending(): ApiError {
    return new ApiError(403, ErrorCode.ACCOUNT_PENDING, 'Your account is pending approval');
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default error values
  let statusCode = 500;
  let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected error occurred';
  let details = undefined;

  // Handle ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;

    // Log operational errors at different levels
    if (err.isOperational) {
      if (statusCode >= 500) {
        logger.error('Operational error:', {
          code: errorCode,
          message,
          details,
          stack: err.stack,
          path: req.path,
          method: req.method
        });
      } else {
        logger.warn('Client error:', {
          code: errorCode,
          message,
          details,
          path: req.path
        });
      }
    } else {
      // Log programming/unknown errors
      logger.error('Non-operational error:', {
        code: errorCode,
        message,
        stack: err.stack,
        path: req.path,
        method: req.method
      });
    }
  } else {
    // Handle unexpected errors
    logger.error('Unexpected error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details }),
      ...(isDevelopment && { stack: err.stack })
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Async handler wrapper to catch errors in async routes
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}