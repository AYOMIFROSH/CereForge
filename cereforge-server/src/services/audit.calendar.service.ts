// src/services/audit.calendar.service.ts
// =====================================================
// CALENDAR AUDIT LOGGING SERVICE
// Follows existing audit.service.ts pattern
// =====================================================

import { createAuditLog } from './audit.service';
import logger from '../utils/logger';

/**
 * Log calendar event created
 */
export async function logCalendarEventCreated(
  userId: string,
  eventId: string,
  ipAddress: string,
  details: {
    title: string;
    hasGuests: boolean;
    isRecurring: boolean;
    recurrenceType?: string;
  }
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'calendar_event_created',
    entityType: 'calendar_event',
    entityId: eventId,
    ipAddress,
    details,
    riskLevel: 'low'
  });
}

/**
 * Log calendar event updated
 */
export async function logCalendarEventUpdated(
  userId: string,
  eventId: string,
  ipAddress: string,
  details: {
    title?: string;
    fieldsUpdated: string[];
    isRecurringUpdate: boolean;
  }
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'calendar_event_updated',
    entityType: 'calendar_event',
    entityId: eventId,
    ipAddress,
    details,
    riskLevel: 'low'
  });
}

/**
 * Log calendar event deleted
 */
export async function logCalendarEventDeleted(
  userId: string,
  eventId: string,
  ipAddress: string,
  details: {
    title: string;
    deleteType: 'single' | 'thisAndFuture' | 'all';
    isRecurring: boolean;
  }
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'calendar_event_deleted',
    entityType: 'calendar_event',
    entityId: eventId,
    ipAddress,
    details,
    riskLevel: 'medium'
  });
}

/**
 * Log event invitation sent
 */
export async function logEventInvitationSent(
  userId: string,
  eventId: string,
  guestEmail: string,
  details: {
    eventTitle: string;
    guestName: string;
  }
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'event_invitation_sent',
    entityType: 'calendar_event',
    entityId: eventId,
    details: {
      ...details,
      guestEmail
    },
    riskLevel: 'low'
  });
}

/**
 * Log event invitation queued
 */
export async function logEventInvitationQueued(
  eventId: string,
  jobId: string,
  guestEmail: string,
  guestName: string
): Promise<void> {
  try {
    await createAuditLog({
      action: 'event_invitation_queued',
      entityType: 'calendar_event',
      entityId: eventId,
      details: {
        jobId,
        guestEmail,
        guestName
      },
      riskLevel: 'low'
    });
  } catch (error) {
    logger.error('Failed to log event invitation queued:', error);
  }
}

/**
 * Log event invitation failed
 */
export async function logEventInvitationFailed(
  eventId: string,
  jobId: string,
  guestEmail: string,
  error: string
): Promise<void> {
  try {
    await createAuditLog({
      action: 'event_invitation_failed',
      entityType: 'calendar_event',
      entityId: eventId,
      details: {
        jobId,
        guestEmail,
        error
      },
      riskLevel: 'high'
    });
  } catch (err) {
    logger.error('Failed to log event invitation failure:', err);
  }
}

/**
 * Log public holiday created (Admin)
 */
export async function logPublicHolidayCreated(
  userId: string,
  holidayId: string,
  ipAddress: string,
  details: {
    title: string;
    date: string;
    countries?: string[];
  }
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'public_holiday_created',
    entityType: 'public_holiday',
    entityId: holidayId,
    ipAddress,
    details,
    riskLevel: 'medium'
  });
}

/**
 * Log public holiday updated (Admin)
 */
export async function logPublicHolidayUpdated(
  userId: string,
  holidayId: string,
  ipAddress: string,
  details: {
    title?: string;
    fieldsUpdated: string[];
  }
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'public_holiday_updated',
    entityType: 'public_holiday',
    entityId: holidayId,
    ipAddress,
    details,
    riskLevel: 'medium'
  });
}

/**
 * Log public holiday deleted (Admin)
 */
export async function logPublicHolidayDeleted(
  userId: string,
  holidayId: string,
  ipAddress: string,
  details: {
    title: string;
  }
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'public_holiday_deleted',
    entityType: 'public_holiday',
    entityId: holidayId,
    ipAddress,
    details,
    riskLevel: 'high'
  });
}

/**
 * Log event reminder sent
 */
export async function logEventReminderSent(
  userId: string,
  eventId: string,
  reminderId: string,
  details: {
    eventTitle: string;
    reminderType: string;
  }
): Promise<void> {
  try {
    await createAuditLog({
      userId,
      action: 'event_reminder_sent',
      entityType: 'event_reminder',
      entityId: reminderId,
      details: {
        ...details,
        eventId
      },
      riskLevel: 'low'
    });
  } catch (error) {
    logger.error('Failed to log event reminder sent:', error);
  }
}