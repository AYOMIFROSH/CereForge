import { Request, Response } from 'express';
import { verifyEmail, login, logout, refreshAccessToken } from '../services/auth.service';
import { verifyRefreshToken } from '../utils/jwt';
import { logAuthEvent } from '../services/audit.service';
import { asyncHandler } from '../utils/errors';
import logger from '../utils/logger';

/**
 * POST /api/v1/auth/verify-email
 * Step 1 of Smart Login: Verify email and return role + display info
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
    { email, step: 'email_verification', success: result.exists }
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

  // Log successful login
  await logAuthEvent(
    'login',
    result.user.id,
    ipAddress,
    userAgent,
    { email, role }
  );

  // Set httpOnly cookies
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('authToken', result.token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

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
 * Used by frontend to check if user is still authenticated
 */
export const getMeHandler = asyncHandler(async (req: Request, res: Response) => {
  // ✅ User already validated by authenticate middleware
  const user = req.user!;

  // ✅ PERFORMANCE: No database query needed
  // JWT already contains all user info
  // Session validity already checked in middleware

  res.json({
    success: true,
    data: {
      user: {
        id: user.userId,
        email: user.email,
        role: user.role,
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

  // Log logout
  await logAuthEvent(
    'logout',
    user.userId,
    ipAddress,
    userAgent
  );

  // Clear cookies
  res.clearCookie('authToken');
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/v1/auth/refresh
 * ✅ FIXED: Refresh access token using refresh token
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

  // ✅ FIX: Verify refresh token to extract user data
  const payload = verifyRefreshToken(refreshToken);

  if (!payload) {
    // Invalid or expired refresh token - clear cookies
    res.clearCookie('authToken');
    res.clearCookie('refreshToken');
    
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
    // ✅ Now we have userId, sessionId, role from verified token
    const newAccessToken = await refreshAccessToken(
      payload.userId,
      payload.sessionId,
      payload.role
    );

    // Log token refresh
    await logAuthEvent(
      'token_refresh',
      payload.userId,
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      { sessionId: payload.sessionId }
    );

    // Set new access token cookie
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('authToken', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    logger.info(`Access token refreshed for user ${payload.userId}`);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Token refresh failed:', error);
    
    // Clear cookies on error
    res.clearCookie('authToken');
    res.clearCookie('refreshToken');
    
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