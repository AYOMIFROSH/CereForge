import rateLimit from 'express-rate-limit';
import { Errors } from '../utils/errors';

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw Errors.tooManyRequests('Too many requests. Please try again later.');
  },
  skip: () => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test';
  }
});


/**
 * Email verification rate limiter
 * 10 requests per minute per IP
 */
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw Errors.tooManyRequests('Too many email verification attempts. Please try again in a minute.');
  },
  skip: () => process.env.NODE_ENV === 'test'
});

/**
 * Login rate limiter
 * 5 attempts per 15 minutes per email
 */
export const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by email instead of IP
    return req.body?.email || req.ip || 'unknown';
  },
  handler: () => {
    throw Errors.tooManyRequests('Too many login attempts. Please try again in 15 minutes.');
  },
  skip: () => process.env.NODE_ENV === 'test'
});

/**
 * Password reset rate limiter
 * 3 requests per hour per email
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.email || req.ip || 'unknown';
  },
  handler: () => {
    throw Errors.tooManyRequests('Too many password reset requests. Please try again in an hour.');
  },
  skip: () => process.env.NODE_ENV === 'test'
});

/**
 * File upload rate limiter
 * 10 uploads per hour per user
 */
export const fileUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise IP
    return (req as any).user?.userId || req.ip || 'unknown';
  },
  handler: () => {
    throw Errors.tooManyRequests('Too many file uploads. Please try again later.');
  },
  skip: () => process.env.NODE_ENV === 'test'
});

/**
 * ✅ OPTIONAL: Advanced token refresh limiter (per user)
 * Use this if you want to limit per authenticated user instead of IP
 * 
 * This is more lenient but requires valid refresh token to be parsed
 */

export const tokenRefreshLimiterPerUser = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Higher limit since it's per user, not per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Try to extract userId from refresh token (if valid)
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return req.ip || 'unknown';
    }
    
    try {
      // ✅ Import verifyRefreshToken to extract userId
      const { verifyRefreshToken } = require('../utils/jwt');
      const payload = verifyRefreshToken(refreshToken);
      
      if (payload && payload.userId) {
        return `user:${payload.userId}`;
      }
      
      return req.ip || 'unknown';
    } catch (error) {
      // If token is invalid, fall back to IP
      return req.ip || 'unknown';
    }
  },
  handler: () => {
    throw Errors.tooManyRequests('Too many token refresh attempts for your account.');
  },
  skip: () => process.env.NODE_ENV === 'test'
});

