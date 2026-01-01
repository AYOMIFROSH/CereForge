// src/controllers/pendingPartners.controller.ts

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import logger from '../utils/logger';
import {
  getPendingPartners,
  getPendingPartnerById,
  approvePendingPartner,
  rejectPendingPartner,
  updatePendingPartnerStatus,
} from '../services/pendingPartners.service';

/**
 * GET /api/v1/admin/partner-applications
 * List all partner applications with pagination and filters
 */
export const listPartnerApplications = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const queryParams = req.query;

  logger.info(`Fetching partner applications for admin: ${user.userId}`);

  const result = await getPendingPartners(queryParams);

  res.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/admin/partner-applications/:id
 * Get single partner application by ID
 */
export const getPartnerApplication = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  logger.info(`Fetching partner application ${id} for admin: ${user.userId}`);

  const application = await getPendingPartnerById(id);

  res.json({
    success: true,
    data: application,
    timestamp: new Date().toISOString(),
  });
});

/**
 * PATCH /api/v1/admin/partner-applications/:id/status
 * Unified endpoint to update application status
 * Handles: approve, reject, reviewing, pending
 */
export const updatePartnerApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const { status } = req.body;
  const ipAddress = req.ip || 'unknown';

  logger.info(`Updating partner application ${id} status to ${status} by admin: ${user.userId}`);

  // Route to appropriate handler based on status
  switch (status) {
    case 'approved': {
      const { notes } = req.body;
      const result = await approvePendingPartner(id, user.userId, ipAddress, notes);
      
      res.json({
        success: true,
        data: {
          partner: result.partner,
          temporaryPassword: result.temporaryPassword,
        },
        message: 'Partner application approved successfully. Welcome email sent with credentials.',
        timestamp: new Date().toISOString(),
      });
      break;
    }

    case 'rejected': {
      const { reason } = req.body;
      await rejectPendingPartner(id, user.userId, ipAddress, reason);
      
      res.json({
        success: true,
        message: 'Partner application rejected successfully',
        timestamp: new Date().toISOString(),
      });
      break;
    }

    case 'reviewing':
    case 'pending': {
      const application = await updatePendingPartnerStatus(id, status, user.userId, ipAddress);
      
      res.json({
        success: true,
        data: application,
        message: `Application status updated to ${status} successfully`,
        timestamp: new Date().toISOString(),
      });
      break;
    }

    default:
      // This should never happen due to Zod validation
      res.status(400).json({
        success: false,
        message: 'Invalid status',
        timestamp: new Date().toISOString(),
      });
  }
});