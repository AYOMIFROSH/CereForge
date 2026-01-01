// src/routes/admin.routes.ts

import { Router } from 'express';
import {
  listPartnerApplications,
  getPartnerApplication,
  updatePartnerApplicationStatus,
} from '../controllers/pendingPartners.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validator';
import { generalLimiter } from '../middleware/rateLimiter';
import { 
  getPendingPartnersQuerySchema,
  updatePartnerApplicationStatusSchema 
} from '../utils/validators';
import { UserRole } from '../types/types';
import { z } from 'zod';

const router = Router();

// =====================================================
// PARTNER APPLICATIONS ROUTES (Admin/Core only)
// =====================================================

/**
 * GET /api/v1/admin/partner-applications
 * List all partner applications with filters
 */
router.get(
  '/partner-applications',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.CORE),
  generalLimiter,
  validateQuery(getPendingPartnersQuerySchema),
  listPartnerApplications
);

/**
 * GET /api/v1/admin/partner-applications/:id
 * Get single partner application by ID
 */
router.get(
  '/partner-applications/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.CORE),
  generalLimiter,
  validateParams(z.object({ id: z.string().uuid() })),
  getPartnerApplication
);

/**
 * PATCH /api/v1/admin/partner-applications/:id/status
 * Update partner application status
 * 
 * Body examples:
 * - Approve: { "status": "approved", "notes": "Great project!" }
 * - Reject:  { "status": "rejected", "reason": "Insufficient details" }
 * - Review:  { "status": "reviewing" }
 * - Pending: { "status": "pending" }
 */
router.patch(
  '/partner-applications/:id/status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.CORE),
  generalLimiter,
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updatePartnerApplicationStatusSchema),
  updatePartnerApplicationStatus
);

export default router;