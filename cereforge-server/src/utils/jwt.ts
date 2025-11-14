import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import logger from './logger';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRY = (process.env.JWT_EXPIRY || '15m') as string | number;
const JWT_REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRY || '7d') as string | number;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  logger.error('JWT secrets not configured in environment variables');
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be defined');
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'core' | 'admin' | 'partner';
  sessionId: string;
  permissions?: Record<string, boolean>;
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: JWTPayload): string {
  try {
    const token = jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sessionId,
        permissions: payload.permissions
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRY,
        issuer: 'cereforge',
        audience: 'cereforge-api'
      } as SignOptions
    );
    return token;
  } catch (error) {
    logger.error('Failed to generate access token:', error);
    throw new Error('Token generation failed');
  }
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'permissions'>): string {
  try {
    const token = jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sessionId
      },
      JWT_REFRESH_SECRET,
      {
        expiresIn: JWT_REFRESH_EXPIRY,
        issuer: 'cereforge',
        audience: 'cereforge-api'
      } as SignOptions
    );
    return token;
  } catch (error) {
    logger.error('Failed to generate refresh token:', error);
    throw new Error('Refresh token generation failed');
  }
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'cereforge',
      audience: 'cereforge-api'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('Access token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid access token');
    } else {
      logger.error('Token verification failed:', error);
    }
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): Omit<JWTPayload, 'permissions'> | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'cereforge',
      audience: 'cereforge-api'
    }) as Omit<JWTPayload, 'permissions'>;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid refresh token');
    } else {
      logger.error('Refresh token verification failed:', error);
    }
    return null;
  }
}

/**
 * Generate secure random token (for password reset, etc.)
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash token for storage (one-way hash)
 */
export function hashToken(token: string): string {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}