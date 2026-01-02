// src/controllers/partners.controller.ts

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import logger from '../utils/logger';
import {
  getPartners,
  getPartnerById,
  updatePartner,
  updatePartnerStatus,
} from '../services/partners.service';

/**
 * GET /api/v1/admin/partners
 * List all approved partners with pagination and filters
 */
export const listPartners = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const queryParams = req.query;

  logger.info(`Fetching partners for admin: ${user.userId}`);

  const result = await getPartners(queryParams);

  res.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/admin/partners/:id
 * Get single partner by ID with full details
 */
export const getPartner = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  logger.info(`Fetching partner ${id} for admin: ${user.userId}`);

  const partner = await getPartnerById(id);

  res.json({
    success: true,
    data: partner,
    timestamp: new Date().toISOString(),
  });
});

/**
 * PUT /api/v1/admin/partners/:id
 * Update partner information
 */
export const updatePartnerHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const updateData = req.body;
  const ipAddress = req.ip || 'unknown';

  logger.info(`Updating partner ${id} by admin: ${user.userId}`);

  const partner = await updatePartner(id, updateData, user.userId, ipAddress);

  res.json({
    success: true,
    data: partner,
    message: 'Partner updated successfully',
    timestamp: new Date().toISOString(),
  });
});

/**
 * PATCH /api/v1/admin/partners/:id/status
 * Update partner status (active, suspended, paused, completed)
 */
export const updatePartnerStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const { status } = req.body;
  const ipAddress = req.ip || 'unknown';

  logger.info(`Updating partner ${id} status to ${status} by admin: ${user.userId}`);

  const partner = await updatePartnerStatus(id, status, user.userId, ipAddress);

  res.json({
    success: true,
    data: partner,
    message: `Partner status updated to ${status} successfully`,
    timestamp: new Date().toISOString(),
  });
});