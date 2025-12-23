// =====================================================
// CALENDAR CONTROLLERS
// =====================================================

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import logger from '../utils/logger';
import {
  createCalendarEvent,
  getEventsInRange,
  getEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
  createPublicHoliday,
  updatePublicHoliday,
  deletePublicHoliday
} from '../services/calendar.service';
import { GetEventsParams, DeleteEventType } from '../types/calendar.types';

/**
 * POST /api/v1/calendar/events
 * Create new calendar event
 */
export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  console.log('🎯 CONTROLLER - Raw req.body:', JSON.stringify(req.body, null, 2));
  console.log('🎯 CONTROLLER - recurrence field:', JSON.stringify(req.body.recurrence, null, 2));  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const eventData = req.body;

  logger.info(`Creating calendar event for user: ${user.userId}`);

  const event = await createCalendarEvent(eventData, user.userId, ipAddress);

  res.status(201).json({
    success: true,
    data: event,
    message: 'Event created successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/v1/calendar/events
 * Get events in date range
 */
export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  
  const includeRecurring = req.query.includeRecurring === 'true';
  
  const params: GetEventsParams = {
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    includeRecurring
  };

  logger.info(`Fetching events for user: ${user.userId}`, params);

  const result = await getEventsInRange(user.userId, params);

  res.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString()
  });
});
/**
 * GET /api/v1/calendar/events/:id
 * Get single event by ID
 */
export const getEvent = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  logger.info(`Fetching event ${id} for user: ${user.userId}`);

  const event = await getEventById(id, user.userId);

  res.json({
    success: true,
    data: event,
    timestamp: new Date().toISOString()
  });
});

/**
 * PUT /api/v1/calendar/events/:id
 * Update calendar event
 */
export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const ipAddress = req.ip || 'unknown';
  const updateData = req.body;

  logger.info(`Updating event ${id} for user: ${user.userId}`);

  const event = await updateCalendarEvent(id, user.userId, updateData, ipAddress);

  res.json({
    success: true,
    data: event,
    message: 'Event updated successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * DELETE /api/v1/calendar/events/:id
 * Delete calendar event
 */
export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const ipAddress = req.ip || 'unknown';
  const deleteType = (req.query.deleteType as DeleteEventType) || 'single';

  logger.info(`Deleting event ${id} (type: ${deleteType}) for user: ${user.userId}`);

  await deleteCalendarEvent(id, user.userId, deleteType, ipAddress);

  res.json({
    success: true,
    message: 'Event deleted successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/v1/calendar/public-holidays
 * Get public holidays
 */
export const getPublicHolidays = asyncHandler(async (req: Request, res: Response) => {
  const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
  const country = req.query.country as string | undefined;

  logger.info(`Fetching public holidays for year: ${year}`, { country });

  // Calculate date range for the year
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  // Import the helper function
  const { getPublicHolidaysInRange } = await import('../services/calendar.service');
  let holidays = await getPublicHolidaysInRange(startDate, endDate);

  // Filter by country if specified
  if (country) {
    holidays = holidays.filter(h => 
      !h.countries || h.countries.length === 0 || h.countries.includes(country)
    );
  }

  res.json({
    success: true,
    data: holidays,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/v1/calendar/public-holidays
 * Create public holiday (Admin only)
 */
export const createHoliday = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const holidayData = req.body;

  logger.info(`Creating public holiday by admin: ${user.userId}`);

  const holiday = await createPublicHoliday(holidayData, user.userId, ipAddress);

  res.status(201).json({
    success: true,
    data: holiday,
    message: 'Public holiday created successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * PUT /api/v1/calendar/public-holidays/:id
 * Update public holiday (Admin only)
 */
export const updateHoliday = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const ipAddress = req.ip || 'unknown';
  const updateData = req.body;

  logger.info(`Updating public holiday ${id} by admin: ${user.userId}`);

  const holiday = await updatePublicHoliday(id, updateData, user.userId, ipAddress);

  res.json({
    success: true,
    data: holiday,
    message: 'Public holiday updated successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * DELETE /api/v1/calendar/public-holidays/:id
 * Delete public holiday (Admin only)
 */
export const deleteHoliday = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const ipAddress = req.ip || 'unknown';

  logger.info(`Deleting public holiday ${id} by admin: ${user.userId}`);

  await deletePublicHoliday(id, user.userId, ipAddress);

  res.json({
    success: true,
    message: 'Public holiday deleted successfully',
    timestamp: new Date().toISOString()
  });
});