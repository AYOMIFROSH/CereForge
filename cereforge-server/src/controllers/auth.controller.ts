import { Request, Response } from 'express';
import { verifyEmail, login, logout, refreshAccessToken } from '../services/auth.service';
import { verifyRefreshToken } from '../utils/jwt';
import { logAuthEvent } from '../services/audit.service';
import { asyncHandler } from '../utils/errors';
import logger from '../utils/logger';
import { getFreshSupabase } from '../config/database';

/**
 * ✅ FIXED: Cookie Configuration for Development & Production
 */
const getCookieConfig = (maxAge: number) => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    domain: isProduction ? '.cereforge.com' : undefined,
    maxAge,
    path: '/'
  };
};

/**
 * POST /api/v1/auth/verify-email
 * Step 1 of Smart Login: Verify email and return role + display info + systemType
 */
export const verifyEmailHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';

  logger.info(`Email verification attempt for: ${email}`);

  const result = await verifyEmail(email);

  await logAuthEvent(
    result.exists ? 'login' : 'login_failed',
    result.userId,
    ipAddress,
    userAgent,
    {
      email,
      step: 'email_verification',
      success: result.exists,
      systemType: result.systemType
    }
  );

  res.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/v1/auth/login
 * Step 2 of Smart Login: Complete login with password
 */
export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';

  logger.info(`Login attempt for: ${email}`);

  const result = await login(email, password, role, ipAddress, userAgent);

  await logAuthEvent(
    'login',
    result.user.id,
    ipAddress,
    userAgent,
    {
      email,
      role,
      systemType: result.user.systemType
    }
  );

  res.cookie('authToken', result.token, getCookieConfig(15 * 60 * 1000));
  res.cookie('refreshToken', result.refreshToken, getCookieConfig(7 * 24 * 60 * 60 * 1000));

  logger.info(`User ${result.user.email} logged in successfully`);

  res.json({
    success: true,
    data: {
      user: result.user
    },
    message: 'Login successful',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/v1/auth/me
 * ⚡ ULTRA-FAST: Validate current session (JWT only, no DB query)
 */
export const getMeHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;

  res.json({
    success: true,
    data: {
      user: {
        id: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        systemType: user.systemType,
        permissions: user.permissions
      },
      authenticated: true
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/v1/auth/logout
 * Logout user and invalidate session
 */
export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';

  await logout(user.sessionId);

  await logAuthEvent(
    'logout',
    user.userId,
    ipAddress,
    userAgent,
    { systemType: user.systemType }
  );

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    domain: isProduction ? '.cereforge.com' : undefined,
    path: '/'
  };

  res.clearCookie('authToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);

  res.json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/v1/auth/refresh
 * ✅ SECURITY FIX: Validate session is still active before refreshing
 */
export const refreshTokenHandler = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No refresh token provided'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  // ✅ Verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  if (!payload) {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      domain: isProduction ? '.cereforge.com' : undefined,
      path: '/'
    };

    res.clearCookie('authToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    logger.warn('Invalid or expired refresh token received');

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired refresh token'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    // ✅ SECURITY FIX: Validate session is still active
    const adminClient = getFreshSupabase();
    const { data: session, error: sessionError } = await adminClient
      .from('user_sessions')
      .select('is_active, expires_at')
      .eq('id', payload.sessionId)
      .eq('user_id', payload.userId)
      .maybeSingle();

    // ❌ Session not found or inactive
    if (sessionError || !session || !session.is_active) {
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
        domain: isProduction ? '.cereforge.com' : undefined,
        path: '/'
      };

      res.clearCookie('authToken', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);

      logger.warn(`Refresh denied: Session ${payload.sessionId} is ${!session ? 'missing' : 'inactive'}`);

      res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_TERMINATED',
          message: 'Session has been terminated. Please login again.'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // ❌ Session expired
    if (new Date(session.expires_at) < new Date()) {
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
        domain: isProduction ? '.cereforge.com' : undefined,
        path: '/'
      };

      res.clearCookie('authToken', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);

      // Mark session as inactive
      await adminClient
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', payload.sessionId);

      logger.warn(`Refresh denied: Session ${payload.sessionId} expired at ${session.expires_at}`);

      res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired. Please login again.'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // ✅ Session valid - generate new access token
    const newAccessToken = await refreshAccessToken(
      payload.userId,
      payload.sessionId,
      payload.role,
      payload.systemType
    );

    await logAuthEvent(
      'token_refresh',
      payload.userId,
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      {
        sessionId: payload.sessionId,
        systemType: payload.systemType
      }
    );

    res.cookie('authToken', newAccessToken, getCookieConfig(15 * 60 * 1000));

    logger.info(`Access token refreshed for user ${payload.userId}`);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Token refresh failed:', error);

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      domain: isProduction ? '.cereforge.com' : undefined,
      path: '/'
    };

    res.clearCookie('authToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_REFRESH_FAILED',
        message: 'Failed to refresh token'
      },
      timestamp: new Date().toISOString()
    });
  }
});