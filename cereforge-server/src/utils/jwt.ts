import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import logger from './logger';
import { SystemType, UserRole } from '../types/types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRY = (process.env.JWT_EXPIRY || '15m') as string | number;
const JWT_REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRY || '7d') as string | number;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  logger.error('JWT secrets not configured in environment variables');
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be defined');
}

/**
 * ✅ UPDATED: JWT Payload with system_type
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  systemType: SystemType; // ✅ NEW
  sessionId: string;
  permissions?: Record<string, boolean>;
}

/**
 * ✅ UPDATED: Generate access token (short-lived) with systemType
 */
export function generateAccessToken(payload: JWTPayload): string {
  try {
    const token = jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        systemType: payload.systemType, // ✅ NEW
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
 * ✅ UPDATED: Generate refresh token (long-lived) with systemType
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'permissions'>): string {
  try {
    const token = jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        systemType: payload.systemType, // ✅ NEW
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
 * ✅ UPDATED: Verify access token (now includes systemType)
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'cereforge',
      audience: 'cereforge-api'
    }) as JWTPayload;
    
    // ✅ VALIDATION: Ensure systemType exists in token
    if (!decoded.systemType) {
      logger.warn('Token missing systemType - possibly old token');
      return null;
    }
    
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
 * ✅ UPDATED: Verify refresh token (now includes systemType)
 */
export function verifyRefreshToken(token: string): Omit<JWTPayload, 'permissions'> | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'cereforge',
      audience: 'cereforge-api'
    }) as Omit<JWTPayload, 'permissions'>;
    
    // ✅ VALIDATION: Ensure systemType exists in token
    if (!decoded.systemType) {
      logger.warn('Refresh token missing systemType - possibly old token');
      return null;
    }
    
    logger.debug(`Refresh token verified for user ${decoded.userId}`);
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
 * No changes needed
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash token for storage (one-way hash)
 * No changes needed
 */
export function hashToken(token: string): string {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

/**
 * Generate session ID
 * No changes needed
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}