import { Request, Response } from 'express';
import { verifyEmail, login, logout, refreshAccessToken } from '../services/auth.service';
import { verifyRefreshToken } from '../utils/jwt';
import { logAuthEvent } from '../services/audit.service';
import { asyncHandler } from '../utils/errors';
import logger from '../utils/logger';

/**
 * ✅ PRODUCTION-SAFE Cookie Configuration
 * Works across *.cereforge.com subdomains
 */
const getCookieConfig = (maxAge: number) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: 'lax' as const, // 'lax' allows cross-subdomain (cereforge.com → api.cereforge.com)
    domain: isProduction ? '.cereforge.com' : undefined, // ✅ Shared across subdomains
    maxAge,
    path: '/' // Available to all routes
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

  // Log verification attempt
  await logAuthEvent(
    result.exists ? 'login' : 'login_failed',
    result.userId,
    ipAddress,
    userAgent,
    { 
      email, 
      step: 'email_verification', 
      success: result.exists,
      systemType: result.systemType // ✅ NEW: Log system type
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
 * ✅ UPDATED: Sets cookies with subdomain support
 */
export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';

  logger.info(`Login attempt for: ${email}`);

  const result = await login(email, password, role, ipAddress, userAgent);

  // Log successful login
  await logAuthEvent(
    'login',
    result.user.id,
    ipAddress,
    userAgent,
    { 
      email, 
      role,
      systemType: result.user.systemType // ✅ NEW: Log system type
    }
  );

  // ✅ UPDATED: Set httpOnly cookies with subdomain support
  res.cookie('authToken', result.token, getCookieConfig(15 * 60 * 1000)); // 15 minutes
  res.cookie('refreshToken', result.refreshToken, getCookieConfig(7 * 24 * 60 * 60 * 1000)); // 7 days

  // Return user data (tokens in cookies)
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
 * ✅ UPDATED: Returns systemType
 */
export const getMeHandler = asyncHandler(async (req: Request, res: Response) => {
  // ✅ User already validated by authenticate middleware
  const user = req.user!;

  // ✅ PERFORMANCE: No database query needed
  // JWT already contains all user info including systemType
  // Session validity already checked in middleware

  res.json({
    success: true,
    data: {
      user: {
        id: user.userId,
        email: user.email,
        role: user.role,
        systemType: user.systemType, // ✅ NEW
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
 * ✅ UPDATED: Clears cookies properly for subdomains
 */
export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';

  await logout(user.sessionId);

  // Log logout
  await logAuthEvent(
    'logout',
    user.userId,
    ipAddress,
    userAgent,
    { systemType: user.systemType } // ✅ NEW
  );

  // ✅ UPDATED: Clear cookies with same domain config
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
 * ✅ UPDATED: Refresh access token using refresh token with systemType
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

  // ✅ UPDATED: Verify refresh token (now includes systemType)
  const payload = verifyRefreshToken(refreshToken);

  if (!payload) {
    // Invalid or expired refresh token - clear cookies
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
    // ✅ UPDATED: Now includes systemType parameter
    const newAccessToken = await refreshAccessToken(
      payload.userId,
      payload.sessionId,
      payload.role,
      payload.systemType // ✅ NEW
    );

    // Log token refresh
    await logAuthEvent(
      'token_refresh',
      payload.userId,
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      { 
        sessionId: payload.sessionId,
        systemType: payload.systemType // ✅ NEW
      }
    );

    // ✅ Set new access token cookie with subdomain support
    res.cookie('authToken', newAccessToken, getCookieConfig(15 * 60 * 1000));

    logger.info(`Access token refreshed for user ${payload.userId}`);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Token refresh failed:', error);
    
    // Clear cookies on error
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