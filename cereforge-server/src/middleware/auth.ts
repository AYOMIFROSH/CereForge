import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { Errors } from '../utils/errors';
import supabase from '../config/database';
import logger from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Verify JWT token from cookie or Authorization header
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from cookie (preferred) or Authorization header
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

    // Verify token
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      throw Errors.invalidToken();
    }

    // ✅ FIX: Check if session exists and is active
    const { data: session,  } = await supabase
      .from('user_sessions')
      .select('is_active, expires_at')
      .eq('id', payload.sessionId)
      .eq('user_id', payload.userId)
      .single();

    // ✅ If session doesn't exist, it's a new login - allow it
    // ✅ If session exists but inactive, reject
    if (session) {
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

      // ✅ Update last activity only if session exists
      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', payload.sessionId);
    }

    // Verify user still exists and is active
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('status')
      .eq('id', payload.userId)
      .single();

    if (userError || !user) {
      throw Errors.unauthorized('User account not found');
    }

    if (user.status !== 'active') {
      if (user.status === 'suspended') {
        throw Errors.accountSuspended();
      } else if (user.status === 'pending') {
        throw Errors.accountPending();
      } else {
        throw Errors.unauthorized('Account is not active');
      }
    }

    // Attach user to request
    req.user = payload;
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check if user has required role(s)
 */
export function requireRole(...allowedRoles: Array<'core' | 'admin' | 'partner'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw Errors.unauthorized();
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
      if (payload) {
        req.user = payload;
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
}