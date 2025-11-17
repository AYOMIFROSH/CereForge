import { Router } from 'express';
import {
  verifyEmailHandler,
  loginHandler,
  logoutHandler,
  refreshTokenHandler,
  getMeHandler // ✅ NEW
} from '../controllers/auth.controller';
import { validateBody } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import {
  emailVerificationLimiter,
  loginLimiter
} from '../middleware/rateLimiter';
import {
  verifyEmailSchema,
  loginSchema
} from '../utils/validators';

const router = Router();

/**
 * POST /api/v1/auth/verify-email
 * Verify email and get role info (Step 1 of Smart Login)
 */
router.post(
  '/verify-email',
  emailVerificationLimiter,
  validateBody(verifyEmailSchema),
  verifyEmailHandler
);

/**
 * POST /api/v1/auth/login
 * Complete login with password (Step 2 of Smart Login)
 */
router.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  loginHandler
);

/**
 * GET /api/v1/auth/me
 * ⚡ FAST: Check if current session is valid
 * Returns user info if authenticated, 401 if not
 */
router.get(
  '/me',
  authenticate, // ✅ Validates JWT + session
  getMeHandler
);

/**
 * POST /api/v1/auth/logout
 * Logout user (requires authentication)
 */
router.post(
  '/logout',
  authenticate,
  logoutHandler
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  refreshTokenHandler
);

export default router;