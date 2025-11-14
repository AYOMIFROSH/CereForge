import { Request, Response } from 'express';
import { verifyEmail, login, logout, refreshAccessToken } from '../services/auth.service';
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
 * Refresh access token using refresh token
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

  // Verify refresh token (simplified - should use verifyRefreshToken from jwt.ts)
  const user = req.user!;

  const newAccessToken = await refreshAccessToken(
    user.userId,
    user.sessionId,
    user.role
  );

  // Log token refresh
  await logAuthEvent(
    'token_refresh',
    user.userId,
    req.ip || 'unknown',
    req.get('user-agent') || 'unknown'
  );

  // Set new access token cookie
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('authToken', newAccessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    timestamp: new Date().toISOString()
  });
});