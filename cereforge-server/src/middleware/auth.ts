// src/middleware/auth.ts - PROPERLY FIXED VERSION
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
 * ✅ FIXED: JWT-first authentication with optional session validation
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
      throw Errors.unauthorized('No authentication token provided');
    }

    // 2. ✅ Verify JWT token (PRIMARY authentication)
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      throw Errors.invalidToken();
    }

    // 3. ✅ Validate systemType exists in token
    if (!payload.systemType) {
      logger.warn(`Token for user ${payload.userId} missing systemType`);
      throw Errors.invalidToken();
    }

    // 4. ✅ OPTIONAL: Check database session if sessionId exists
    if (payload.sessionId) {
      try {
        const { data: session, error: sessionError } = await supabase
          .from('user_sessions')
          .select('is_active, expires_at')
          .eq('id', payload.sessionId)
          .eq('user_id', payload.userId)
          .maybeSingle();

        // ✅ Only validate session if it exists and no error
        if (!sessionError && session) {
          // Check if session is active
          if (!session.is_active) {
            logger.warn(`Inactive session for user ${payload.userId}`);
            throw Errors.unauthorized('Session has been terminated');
          }

          // Check session expiry
          if (new Date(session.expires_at) < new Date()) {
            // Mark session as inactive
            await supabase
              .from('user_sessions')
              .update({ is_active: false })
              .eq('id', payload.sessionId);
            
            throw Errors.unauthorized('Session has expired');
          }

          // ✅ Update last activity timestamp (fire and forget)
          supabase
            .from('user_sessions')
            .update({ last_activity: new Date().toISOString() })
            .eq('id', payload.sessionId)
            .then(({ error }) => {
              if (error) {
                logger.warn('Failed to update session activity:', error);
              }
            });
        }
        // ✅ If session doesn't exist or error, that's OK - JWT is still valid
      } catch (sessionCheckError) {
        // ✅ Log but don't fail authentication
        logger.warn('Session check failed, continuing with JWT auth:', sessionCheckError);
      }
    }

    // 5. ✅ Verify user exists and is active (required)
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('status, system_type')
      .eq('id', payload.userId)
      .single();

    if (userError || !user) {
      throw Errors.unauthorized('User account not found');
    }

    // 6. ✅ Validate system type matches
    if (user.system_type !== payload.systemType) {
      logger.error(`System type mismatch for user ${payload.userId}: token=${payload.systemType}, db=${user.system_type}`);
      throw Errors.unauthorized('Account configuration mismatch');
    }

    // 7. ✅ Check user status
    if (user.status !== 'active') {
      if (user.status === 'suspended') {
        throw Errors.accountSuspended();
      } else if (user.status === 'pending') {
        throw Errors.accountPending();
      } else {
        throw Errors.unauthorized('Account is not active');
      }
    }

    // 8. ✅ Attach user payload to request
    req.user = payload;
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * ✅ UPDATED: Check if user has required role(s) AND is SYSTEM_USER
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw Errors.unauthorized();
      }

      // ✅ SYSTEM_USERS ONLY
      if (req.user.systemType !== SystemType.SYSTEM_USERS) {
        logger.warn(`Non-system user ${req.user.userId} attempted to access system route`);
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
 * ✅ NEW: Check if user is SYSTEM_USER
 */
export function requireSystemUser() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw Errors.unauthorized();
      }

      if (req.user.systemType !== SystemType.SYSTEM_USERS) {
        logger.warn(`Non-system user ${req.user.userId} attempted to access system-only route`);
        throw Errors.forbidden('This route is for system users only');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * ✅ NEW: Check if user is COMMERCIAL_USER
 */
export function requireCommercialUser() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw Errors.unauthorized();
      }

      if (req.user.systemType !== SystemType.COMMERCIAL_USERS) {
        logger.warn(`Non-commercial user ${req.user.userId} attempted to access commercial route`);
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