// src/middleware/auth.ts - OPTIMIZED VERSION
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { Errors } from '../utils/errors';
import supabase from '../config/database';
import logger from '../utils/logger';
import { SystemType, UserRole } from '../types/types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * ✅ OPTIMIZED: JWT-first with minimal DB queries
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Get token from cookie (preferred) or Authorization header
    let token = req.cookies?.authToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      logger.warn('No authentication token provided', {
        code: 'UNAUTHORIZED',
        path: req.path
      });
      throw Errors.unauthorized('No authentication token provided');
    }

    // 2. ✅ Verify JWT token (PRIMARY authentication - no DB query)
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      throw Errors.invalidToken();
    }

    // 3. ✅ Validate systemType exists in token
    if (!payload.systemType) {
      logger.warn(`Token missing systemType for user ${payload.userId}`);
      throw Errors.invalidToken();
    }

    // 4. ✅ OPTIMIZED: Single DB query for user validation (combined)
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('status, system_type')
      .eq('id', payload.userId)
      .single();

    if (userError || !user) {
      logger.warn(`User ${payload.userId} not found in database`);
      throw Errors.unauthorized('User account not found');
    }

    // 5. ✅ Validate system type matches
    if (user.system_type !== payload.systemType) {
      logger.error(`System type mismatch for user ${payload.userId}`);
      throw Errors.unauthorized('Account configuration mismatch');
    }

    // 6. ✅ Check user status
    if (user.status !== 'active') {
      if (user.status === 'suspended') {
        throw Errors.accountSuspended();
      } else if (user.status === 'pending') {
        throw Errors.accountPending();
      } else {
        throw Errors.unauthorized('Account is not active');
      }
    }

    // 7. ✅ OPTIONAL: Lightweight session check (async, non-blocking)
    if (payload.sessionId) {
      // Fire-and-forget session activity update
      supabase
        .from('user_sessions')
        .select('is_active, expires_at')
        .eq('id', payload.sessionId)
        .eq('user_id', payload.userId)
        .maybeSingle()
        .then(({ data: session, error }) => {
          if (!error && session) {
            // Check if session is valid
            if (!session.is_active || new Date(session.expires_at) < new Date()) {
              logger.warn(`Invalid session ${payload.sessionId} for user ${payload.userId}`);
              return;
            }

            // Update last activity (fire-and-forget)
            supabase
              .from('user_sessions')
              .update({ last_activity: new Date().toISOString() })
              .eq('id', payload.sessionId)
              .then(({ error: updateError }) => {
                if (updateError) {
                  logger.warn('Failed to update session activity:', updateError);
                }
              });
          }
        });
    }

    // 8. ✅ Attach user payload to request (JWT is source of truth)
    req.user = payload;
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * ✅ Check if user has required role(s) AND is SYSTEM_USER
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw Errors.unauthorized();
      }

      // SYSTEM_USERS ONLY
      if (req.user.systemType !== SystemType.SYSTEM_USERS) {
        logger.warn(`Non-system user ${req.user.userId} attempted system route`);
        throw Errors.forbidden('This route is for system users only');
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`Access denied for role ${req.user.role} to ${req.path}`);
        throw Errors.insufficientPermissions();
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * ✅ Check if user is SYSTEM_USER
 */
export function requireSystemUser() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw Errors.unauthorized();
      }

      if (req.user.systemType !== SystemType.SYSTEM_USERS) {
        logger.warn(`Non-system user ${req.user.userId} attempted system route`);
        throw Errors.forbidden('This route is for system users only');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * ✅ Check if user is COMMERCIAL_USER
 */
export function requireCommercialUser() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw Errors.unauthorized();
      }

      if (req.user.systemType !== SystemType.COMMERCIAL_USERS) {
        logger.warn(`Non-commercial user ${req.user.userId} attempted commercial route`);
        throw Errors.forbidden('This route is for commercial users only');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Check if user has specific permission
 */
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw Errors.unauthorized();
      }

      if (!req.user.permissions || !req.user.permissions[permission]) {
        logger.warn(`Permission denied: ${permission} for user ${req.user.userId}`);
        throw Errors.insufficientPermissions();
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Optional authentication (doesn't fail if no token)
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.authToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload && payload.systemType) {
        req.user = payload;
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
}