// src/routes/calendar.routes.ts
// =====================================================
// CALENDAR ROUTES
// Following existing route structure with proper middleware
// =====================================================

import { Router } from 'express';
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getPublicHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday
} from '../controllers/calendar.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validator';
import { generalLimiter } from '../middleware/rateLimiter';
import {
  createCalendarEventSchema,
  updateCalendarEventSchema,
  getEventsQuerySchema,
  deleteEventQuerySchema,
  createPublicHolidaySchema,
  getPublicHolidaysQuerySchema
} from '../utils/validators';
import { UserRole } from '../types/types';

const router = Router();

// =====================================================
// CALENDAR EVENT ROUTES (Authenticated users)
// =====================================================

/**
 * GET /api/v1/calendar/events
 * Get events in date range with recurring instances
 * Query params: startDate, endDate, includeRecurring
 */
router.get(
  '/events',
  authenticate,
  generalLimiter,
  validateQuery(getEventsQuerySchema),
  getEvents
);

/**
 * POST /api/v1/calendar/events
 * Create new calendar event
 * Body: { title, startTime, endTime, recurrence, guests[], ... }
 */
router.post(
  '/events',
  authenticate,
  generalLimiter,
  validateBody(createCalendarEventSchema),
  createEvent
);

/**
 * GET /api/v1/calendar/events/:id
 * Get single event by ID
 */
router.get(
  '/events/:id',
  authenticate,
  generalLimiter,
  getEvent
);

/**
 * PUT /api/v1/calendar/events/:id
 * Update calendar event
 * Body: Partial event data
 */
router.put(
  '/events/:id',
  authenticate,
  generalLimiter,
  validateBody(updateCalendarEventSchema),
  updateEvent
);

/**
 * DELETE /api/v1/calendar/events/:id
 * Delete calendar event
 * Query param: deleteType ('single' | 'thisAndFuture' | 'all')
 */
router.delete(
  '/events/:id',
  authenticate,
  generalLimiter,
  validateQuery(deleteEventQuerySchema),
  deleteEvent
);

// =====================================================
// PUBLIC HOLIDAYS ROUTES
// =====================================================

/**
 * GET /api/v1/calendar/public-holidays
 * Get public holidays (Open to all authenticated users)
 * Query params: year, country
 */
router.get(
  '/public-holidays',
  authenticate,
  generalLimiter,
  validateQuery(getPublicHolidaysQuerySchema),
  getPublicHolidays
);

/**
 * POST /api/v1/calendar/public-holidays
 * Create public holiday (Admin/Core only)
 * Body: { title, holidayDate, isRecurring, countries[] }
 */
router.post(
  '/public-holidays',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.CORE),
  generalLimiter,
  validateBody(createPublicHolidaySchema),
  createHoliday
);

/**
 * PUT /api/v1/calendar/public-holidays/:id
 * Update public holiday (Admin/Core only)
 * Body: Partial holiday data
 */
router.put(
  '/public-holidays/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.CORE),
  generalLimiter,
  validateBody(createPublicHolidaySchema.partial()),
  updateHoliday
);

/**
 * DELETE /api/v1/calendar/public-holidays/:id
 * Delete public holiday (Admin/Core only)
 */
router.delete(
  '/public-holidays/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.CORE),
  generalLimiter,
  deleteHoliday
);

export default router;