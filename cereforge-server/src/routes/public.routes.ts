import { Router } from 'express';
import { submitGetStartedForm } from '../controllers/getStarted.controller';
import { validateBody } from '../middleware/validator';
import { generalLimiter } from '../middleware/rateLimiter';
import { getStartedSchema } from '../utils/validators';

const router = Router();

/**
 * POST /api/v1/public/get-started
 * Submit Get Started form (partner application)
 */
router.post(
  '/get-started',
  generalLimiter,
  validateBody(getStartedSchema),
  submitGetStartedForm
);

export default router;