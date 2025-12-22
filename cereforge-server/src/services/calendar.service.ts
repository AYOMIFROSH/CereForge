// src/services/calendar.service.ts
// =====================================================
// CALENDAR SERVICE - PRODUCTION GRADE
// Handles all calendar operations with proper error handling
// =====================================================

import { getFreshSupabase } from '../config/database';
import supabase from '../config/database';
import { Errors } from '../utils/errors';
import logger from '../utils/logger';
import dayjs from 'dayjs';
import { queueEventInvitation, queueEventReminder as queueReminderJob } from '../queues/calendar.queue';
import { generateRecurringInstances } from '../utils/recurrenece';
import {
  CalendarEvent,
  CreateEventInput,
  UpdateEventInput,
  GetEventsParams,
  CalendarEventsResponse,
  PublicHoliday,
  CreatePublicHolidayInput,
  DeleteEventType
} from '../types/calendar.types';
import {
  logCalendarEventCreated,
  logCalendarEventUpdated,
  logCalendarEventDeleted,
  logPublicHolidayCreated,
  logPublicHolidayUpdated,
  logPublicHolidayDeleted
} from './audit.calendar.service';

/**
 * Create a new calendar event
 */
// src/services/calendar.service.ts - FIXED CUSTOM RECURRENCE SAVING

export async function createCalendarEvent(
  data: CreateEventInput,
  userId: string,
  ipAddress: string
): Promise<CalendarEvent> {
  const adminClient = getFreshSupabase();

  try {
    // ✅ FIXED: Properly handle custom recurrence config
    let recurrenceType = data.recurrence.type;
    let recurrenceConfig = null;

    if (data.recurrence.type === 'custom' && data.recurrence.config) {
      // ✅ Extract custom config properly
      const customConfig = data.recurrence.config;
      
      recurrenceConfig = {
        type: 'custom',
        interval: customConfig.interval || 1,
        repeatUnit: customConfig.repeatUnit || 'day', // ✅ NEW: day/week/month/year
        daysOfWeek: customConfig.daysOfWeek || [],
        endType: customConfig.endType || 'never',
        endDate: customConfig.endDate || null,
        occurrences: customConfig.occurrences || null
      };

      console.log('📅 Creating custom recurrence event:', recurrenceConfig);
    } else if (data.recurrence.type !== 'none') {
      // ✅ Simple recurrence types (daily, weekly, etc.)
      recurrenceConfig = {
        type: data.recurrence.type
      };
    }

    // Create parent event
    const { data: event, error } = await adminClient
      .from('calendar_events')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        start_time: data.startTime,
        end_time: data.endTime,
        all_day: data.allDay,
        timezone: data.timezone,
        recurrence_type: recurrenceType,
        recurrence_config: recurrenceConfig, // ✅ Save custom config as JSONB
        is_recurring_parent: recurrenceType !== 'none',
        label: data.label,
        notification_settings: data.notificationSettings,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create calendar event:', error);
      throw Errors.database('Failed to create event');
    }

    // Add guests if provided
    if (data.guests && data.guests.length > 0) {
      await addGuestsToEvent(event.id, data.guests, data.sendInvitations || false);
    }

    // Queue reminder if notification is set
    if (data.notificationSettings.type !== 'Snooze' && data.notificationSettings.interval) {
      await queueEventReminder(event.id, userId, data.notificationSettings);
    }

    // Audit log
    await logCalendarEventCreated(
      userId,
      event.id,
      ipAddress,
      {
        title: data.title,
        hasGuests: (data.guests?.length || 0) > 0,
        isRecurring: recurrenceType !== 'none',
        recurrenceType: recurrenceType
      }
    );

    logger.info(`Calendar event created: ${event.id} by user ${userId}`);

    return event as CalendarEvent;
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Create calendar event error:', error);
    throw Errors.internal('Failed to create calendar event');
  }
}

/**
 * Get events in date range with recurring instances
 */
/**
 * Get events in date range with recurring instances
 */
export async function getEventsInRange(
  userId: string,
  params: GetEventsParams
): Promise<CalendarEventsResponse> {
  try {
    const { startDate, endDate, includeRecurring = true } = params;

    // ✅ FIX: Better logging
    logger.info(`📅 Fetching events for user: ${userId}`, {
      startDate,
      endDate,
      includeRecurring,
    });

    // ✅ OPTIMIZED: Use better query with proper date filtering
    const { data: userEvents, error } = await supabase
      .from('calendar_events')
      .select('*, event_guests(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .lte('start_time', endDate)
      .order('start_time', { ascending: true });

    if (error) {
      logger.error('Failed to fetch calendar events:', error);
      throw Errors.database('Failed to fetch events');
    }

    // ✅ Fetch public holidays in parallel (non-blocking)
    const publicHolidaysPromise = getPublicHolidaysInRange(
      new Date(startDate),
      new Date(endDate)
    );

    // Expand recurring events if requested
    let expandedEvents: CalendarEvent[] = userEvents || [];

    // After line 148 (after expandRecurringEvents)
    if (includeRecurring && userEvents) {
      const allExpanded = expandRecurringEvents(
        userEvents,
        new Date(startDate),
        new Date(endDate)
      );

      // ✅ Filter expanded instances to only include those in range
      expandedEvents = allExpanded.filter(event => {
        const eventStart = new Date(event.start_time);
        const rangeStart = new Date(startDate);
        const rangeEnd = new Date(endDate);
        return eventStart >= rangeStart && eventStart <= rangeEnd;
      });
    }
    // ✅ Wait for holidays (processed in parallel)
    const publicHolidays = await publicHolidaysPromise;

    logger.info(`✅ Found ${expandedEvents.length} events, ${publicHolidays.length} holidays`);

    return {
      userEvents: expandedEvents,
      publicHolidays
    };
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Get events in range error:', error);
    throw Errors.internal('Failed to fetch events');
  }
}

/**
 * Get single event by ID
 */
export async function getEventById(
  eventId: string,
  userId: string
): Promise<CalendarEvent> {
  try {
    const { data: event, error } = await supabase
      .from('calendar_events')
      .select('*, event_guests(*)')
      .eq('id', eventId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single();

    if (error || !event) {
      throw Errors.notFound('Event');
    }

    return event as CalendarEvent;
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Get event by ID error:', error);
    throw Errors.internal('Failed to fetch event');
  }
}

/**
 * Update calendar event
 */
export async function updateCalendarEvent(
  eventId: string,
  userId: string,
  data: UpdateEventInput,
  ipAddress: string
): Promise<CalendarEvent> {
  const adminClient = getFreshSupabase();

  try {
    // First, verify ownership
    const { data: existingEvent, error: fetchError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingEvent) {
      throw Errors.notFound('Event');
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.startTime !== undefined) updateData.start_time = data.startTime;
    if (data.endTime !== undefined) updateData.end_time = data.endTime;
    if (data.allDay !== undefined) updateData.all_day = data.allDay;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.label !== undefined) updateData.label = data.label;
    if (data.status !== undefined) updateData.status = data.status;

    if (data.recurrence) {
      updateData.recurrence_type = data.recurrence.type;
      updateData.recurrence_config = data.recurrence.type !== 'none' ? data.recurrence : null;
      updateData.is_recurring_parent = data.recurrence.type !== 'none';
    }

    if (data.notificationSettings) {
      updateData.notification_settings = data.notificationSettings;
    }

    // Update event
    const { data: updatedEvent, error: updateError } = await adminClient
      .from('calendar_events')
      .update(updateData)
      .eq('id', eventId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError || !updatedEvent) {
      logger.error('Failed to update calendar event:', updateError);
      throw Errors.database('Failed to update event');
    }

    // Audit log
    await logCalendarEventUpdated(
      userId,
      eventId,
      ipAddress,
      {
        title: data.title,
        fieldsUpdated: Object.keys(data),
        isRecurringUpdate: !!existingEvent.is_recurring_parent
      }
    );

    logger.info(`Calendar event updated: ${eventId} by user ${userId}`);

    return updatedEvent as CalendarEvent;
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Update calendar event error:', error);
    throw Errors.internal('Failed to update event');
  }
}


// src/services/calendar.service.ts (PART 2)
// =====================================================
// REMAINING HELPER FUNCTIONS
// Add these to the calendar.service.ts file after PART 1
// =====================================================

/**
 * Delete calendar event with recurring logic
 */
export async function deleteCalendarEvent(
  eventId: string,
  userId: string,
  deleteType: DeleteEventType,
  ipAddress: string
): Promise<void> {
  const adminClient = getFreshSupabase();

  try {
    // Fetch event to verify ownership and get details
    const { data: event, error: fetchError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !event) {
      throw Errors.notFound('Event');
    }

    switch (deleteType) {
      case 'single':
        // Soft delete single event
        const { error: deleteError } = await adminClient
          .from('calendar_events')
          .update({
            deleted_at: new Date().toISOString(),
            status: 'cancelled'
          })
          .eq('id', eventId)
          .eq('user_id', userId);

        if (deleteError) {
          throw Errors.database('Failed to delete event');
        }
        break;

      case 'thisAndFuture':
        // For recurring events: end the series at this point
        if (event.is_recurring_parent && event.recurrence_config) {
          const { error: updateError } = await adminClient
            .from('calendar_events')
            .update({
              recurrence_config: {
                ...event.recurrence_config,
                endType: 'on',
                endDate: dayjs(event.start_time).subtract(1, 'day').toISOString()
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', eventId)
            .eq('user_id', userId);

          if (updateError) {
            throw Errors.database('Failed to update recurring event');
          }
        } else {
          // Not a recurring event, treat as single
          await deleteCalendarEvent(eventId, userId, 'single', ipAddress);
          return;
        }
        break;

      case 'all':
        // Delete parent and all child instances
        const { error: deleteAllError } = await adminClient
          .from('calendar_events')
          .update({
            deleted_at: new Date().toISOString(),
            status: 'cancelled'
          })
          .or(`id.eq.${eventId},parent_event_id.eq.${eventId}`)
          .eq('user_id', userId);

        if (deleteAllError) {
          throw Errors.database('Failed to delete all event instances');
        }
        break;
    }

    // Audit log
    await logCalendarEventDeleted(
      userId,
      eventId,
      ipAddress,
      {
        title: event.title,
        deleteType,
        isRecurring: event.is_recurring_parent
      }
    );

    logger.info(`Calendar event deleted: ${eventId} (type: ${deleteType}) by user ${userId}`);
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Delete calendar event error:', error);
    throw Errors.internal('Failed to delete event');
  }
}

/**
 * Add guests to event and optionally send invitations
 */
async function addGuestsToEvent(
  eventId: string,
  guests: { email: string; name: string }[],
  sendInvitations: boolean
): Promise<void> {
  const adminClient = getFreshSupabase();

  try {
    // Insert guests
    const guestRecords = guests.map(guest => ({
      event_id: eventId,
      email: guest.email,
      name: guest.name,
      invitation_sent: sendInvitations,
      invitation_sent_at: sendInvitations ? new Date().toISOString() : null,
      response_status: 'pending' as const
    }));

    const { error } = await adminClient
      .from('event_guests')
      .insert(guestRecords);

    if (error) {
      logger.error('Failed to add guests to event:', error);
      throw Errors.database('Failed to add guests');
    }

    // Queue invitation emails if requested
    if (sendInvitations) {
      for (const guest of guests) {
        await queueEventInvitation(eventId, guest.email, guest.name);
      }
    }

    logger.info(`Added ${guests.length} guests to event ${eventId}`);
  } catch (error) {
    logger.error('Add guests to event error:', error);
    throw error;
  }
}

/**
 * Queue event reminder based on notification settings
 */
async function queueEventReminder(
  eventId: string,
  userId: string,
  notificationSettings: any
): Promise<void> {
  try {
    // Calculate reminder time based on settings
    const { data: event } = await supabase
      .from('calendar_events')
      .select('start_time, title')
      .eq('id', eventId)
      .single();

    if (!event) return;

    let remindAt: Date;
    const eventStart = new Date(event.start_time);

    if (notificationSettings.interval && notificationSettings.timeUnit) {
      const { interval, timeUnit } = notificationSettings;

      switch (timeUnit) {
        case 'Minute':
          remindAt = dayjs(eventStart).subtract(interval, 'minute').toDate();
          break;
        case 'Hour':
          remindAt = dayjs(eventStart).subtract(interval, 'hour').toDate();
          break;
        case 'Day':
          remindAt = dayjs(eventStart).subtract(interval, 'day').toDate();
          break;
        default:
          remindAt = dayjs(eventStart).subtract(15, 'minute').toDate();
      }

      // Queue the reminder job
      await queueReminderJob(eventId, userId, remindAt, event.title);
    }
  } catch (error) {
    logger.error('Queue event reminder error:', error);
    // Don't throw - reminder is non-critical
  }
}

/**
 * Expand recurring events into instances
 */
function expandRecurringEvents(
  events: any[],
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  const expanded: CalendarEvent[] = [];

  events.forEach(event => {
    if (event.is_recurring_parent && event.recurrence_type !== 'none') {
      // Generate recurring instances
      const instances = generateRecurringInstances(event, startDate, endDate);
      expanded.push(...instances);
    } else {
      // Add non-recurring event as-is
      expanded.push(event);
    }
  });

  return expanded;
}

/**
 * Get public holidays in date range
 */
export async function getPublicHolidaysInRange(
  startDate: Date,
  endDate: Date
): Promise<PublicHoliday[]> {
  try {
    const startYear = dayjs(startDate).year();
    const endYear = dayjs(endDate).year();
    const years = [startYear];

    if (endYear !== startYear) {
      years.push(endYear);
    }

    const { data: holidays, error } = await supabase
      .from('public_holidays')
      .select('*')
      .eq('is_active', true)
      .gte('holiday_date', dayjs(startDate).utc().format('YYYY-MM-DD'))
      .lte('holiday_date', dayjs(endDate).utc().format('YYYY-MM-DD'))
      .order('holiday_date', { ascending: true });

    if (error) {
      logger.error('Failed to fetch public holidays:', error);
      return [];
    }

    return holidays as PublicHoliday[];
  } catch (error) {
    logger.error('Get public holidays error:', error);
    return [];
  }
}

/**
 * Create public holiday (Admin only)
 */
export async function createPublicHoliday(
  data: CreatePublicHolidayInput,
  userId: string,
  ipAddress: string
): Promise<PublicHoliday> {
  const adminClient = getFreshSupabase();

  try {
    const { data: holiday, error } = await adminClient
      .from('public_holidays')
      .insert({
        title: data.title,
        description: data.description || null,
        holiday_date: dayjs(data.holidayDate).format('YYYY-MM-DD'),
        is_recurring: data.isRecurring,
        countries: data.countries || null,
        created_by: userId,
        is_active: true
      })
      .select()
      .single();

    if (error || !holiday) {
      logger.error('Failed to create public holiday:', error);
      throw Errors.database('Failed to create public holiday');
    }

    // Audit log
    await logPublicHolidayCreated(
      userId,
      holiday.id,
      ipAddress,
      {
        title: data.title,
        date: data.holidayDate,
        countries: data.countries
      }
    );

    logger.info(`Public holiday created: ${holiday.id} by user ${userId}`);

    return holiday as PublicHoliday;
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Create public holiday error:', error);
    throw Errors.internal('Failed to create public holiday');
  }
}

/**
 * Update public holiday (Admin only)
 */
export async function updatePublicHoliday(
  holidayId: string,
  data: Partial<CreatePublicHolidayInput>,
  userId: string,
  ipAddress: string
): Promise<PublicHoliday> {
  const adminClient = getFreshSupabase();

  try {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.holidayDate !== undefined) {
      updateData.holiday_date = dayjs(data.holidayDate).format('YYYY-MM-DD');
    }
    if (data.isRecurring !== undefined) updateData.is_recurring = data.isRecurring;
    if (data.countries !== undefined) updateData.countries = data.countries;

    const { data: holiday, error } = await adminClient
      .from('public_holidays')
      .update(updateData)
      .eq('id', holidayId)
      .select()
      .single();

    if (error || !holiday) {
      throw Errors.notFound('Public holiday');
    }

    // Audit log
    await logPublicHolidayUpdated(
      userId,
      holidayId,
      ipAddress,
      {
        title: data.title,
        fieldsUpdated: Object.keys(data)
      }
    );

    logger.info(`Public holiday updated: ${holidayId} by user ${userId}`);

    return holiday as PublicHoliday;
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Update public holiday error:', error);
    throw Errors.internal('Failed to update public holiday');
  }
}

/**
 * Delete public holiday (Admin only)
 */
export async function deletePublicHoliday(
  holidayId: string,
  userId: string,
  ipAddress: string
): Promise<void> {
  const adminClient = getFreshSupabase();

  try {
    // Fetch holiday details for audit
    const { data: holiday, error: fetchError } = await supabase
      .from('public_holidays')
      .select('title')
      .eq('id', holidayId)
      .single();

    if (fetchError || !holiday) {
      throw Errors.notFound('Public holiday');
    }

    // Soft delete by marking as inactive
    const { error } = await adminClient
      .from('public_holidays')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', holidayId);

    if (error) {
      throw Errors.database('Failed to delete public holiday');
    }

    // Audit log
    await logPublicHolidayDeleted(
      userId,
      holidayId,
      ipAddress,
      {
        title: holiday.title
      }
    );

    logger.info(`Public holiday deleted: ${holidayId} by user ${userId}`);
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Delete public holiday error:', error);
    throw Errors.internal('Failed to delete public holiday');
  }
}
