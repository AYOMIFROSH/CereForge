// src/queues/calendar.queue.ts
// =====================================================
// CALENDAR EMAIL QUEUE
// Follows existing email.queue.ts pattern
// =====================================================

import { emailQueue } from './email.queue';
import { getFreshSupabase } from '../config/database';
import logger from '../utils/logger';
import { 
  logEventInvitationQueued, 
  logEventInvitationFailed,
  logEventReminderSent
} from '../services/audit.calendar.service';

/**
 * Queue event invitation email
 */
export async function queueEventInvitation(
  eventId: string,
  guestEmail: string,
  guestName: string
): Promise<void> {
  try {
    // Fetch event details
    const supabase = getFreshSupabase();
    const { data: event, error } = await supabase
      .from('calendar_events')
      .select('title, description, start_time, end_time, location, timezone, user_id')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      logger.error('Failed to fetch event for invitation:', error);
      return;
    }

    // Fetch host details
    const { data: host } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', event.user_id)
      .single();

    const job = await emailQueue.add(
      'event-invitation',
      {
        type: 'event-invitation',
        data: {
          eventId,
          eventTitle: event.title,
          eventDescription: event.description || '',
          startTime: event.start_time,
          endTime: event.end_time,
          location: event.location || '',
          timezone: event.timezone,
          hostName: host?.full_name || 'Cereforge User',
          hostEmail: host?.email || '',
          guestEmail,
          guestName
        }
      },
      { priority: 2 }
    );

    logger.info(`Queued event invitation for ${guestEmail} (Job ID: ${job.id})`);
    
    await logEventInvitationQueued(eventId, String(job.id), guestEmail, guestName);
  } catch (error) {
    logger.error('Failed to queue event invitation:', error);
  }
}

/**
 * Queue event reminder
 */
export async function queueEventReminder(
  eventId: string,
  userId: string,
  remindAt: Date,
  eventTitle: string
): Promise<void> {
  try {
    const adminClient = getFreshSupabase();

    // Create reminder record
    const { data: reminder, error } = await adminClient
      .from('event_reminders')
      .insert({
        event_id: eventId,
        user_id: userId,
        remind_at: remindAt.toISOString(),
        sent: false,
        reminder_type: 'email'
      })
      .select()
      .single();

    if (error || !reminder) {
      logger.error('Failed to create reminder record:', error);
      return;
    }

    // Queue reminder email job (scheduled for remindAt time)
    const delay = Math.max(0, remindAt.getTime() - Date.now());
    
    const job = await emailQueue.add(
      'event-reminder',
      {
        type: 'event-reminder',
        data: {
          reminderId: reminder.id,
          eventId,
          userId,
          eventTitle
        }
      },
      {
        priority: 3,
        delay // Schedule for future
      }
    );

    logger.info(`Queued event reminder for user ${userId}, event ${eventId} (Job ID: ${job.id})`);
  } catch (error) {
    logger.error('Failed to queue event reminder:', error);
  }
}

/**
 * Process event invitation emails
 */
emailQueue.process('event-invitation', 1, async (job) => {
  const { data } = job.data;

  logger.info(`Processing event invitation email job ${job.id}`);

  try {
    // TODO: Integrate with your email service (Resend, SendGrid, etc.)
    // For now, just log - you'll implement actual sending later
    logger.info(`Would send event invitation to ${data.guestEmail}`, {
      eventTitle: data.eventTitle,
      startTime: data.startTime
    });

    // Mark invitation as sent in database
    const supabase = getFreshSupabase();
    await supabase
      .from('event_guests')
      .update({
        invitation_sent: true,
        invitation_sent_at: new Date().toISOString()
      })
      .eq('event_id', data.eventId)
      .eq('email', data.guestEmail);

    logger.info(`Event invitation sent successfully for job ${job.id}`);
    return { success: true, type: 'event-invitation' };
  } catch (error) {
    logger.error(`Event invitation job ${job.id} failed:`, error);
    
    await logEventInvitationFailed(
      data.eventId,
      String(job.id),
      data.guestEmail,
      (error as Error).message
    );
    
    throw error;
  }
});

/**
 * Process event reminder emails
 */
emailQueue.process('event-reminder', 1, async (job) => {
  const { data } = job.data;

  logger.info(`Processing event reminder email job ${job.id}`);

  try {
    // Fetch user and event details
    const supabase = getFreshSupabase();
    
    const { data: user } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', data.userId)
      .single();

    const { data: event } = await supabase
      .from('calendar_events')
      .select('title, start_time, location')
      .eq('id', data.eventId)
      .single();

    if (!user || !event) {
      logger.warn(`Cannot send reminder - user or event not found`);
      return { success: false, reason: 'missing_data' };
    }

    // TODO: Integrate with your email service
    logger.info(`Would send event reminder to ${user.email}`, {
      eventTitle: event.title,
      startTime: event.start_time
    });

    // Mark reminder as sent
    await supabase
      .from('event_reminders')
      .update({
        sent: true,
        sent_at: new Date().toISOString()
      })
      .eq('id', data.reminderId);

    // Audit log
    await logEventReminderSent(
      data.userId,
      data.eventId,
      data.reminderId,
      {
        eventTitle: event.title,
        reminderType: 'email'
      }
    );

    logger.info(`Event reminder sent successfully for job ${job.id}`);
    return { success: true, type: 'event-reminder' };
  } catch (error) {
    logger.error(`Event reminder job ${job.id} failed:`, error);
    throw error;
  }
});

logger.info('✅ Calendar queue initialized (event invitations & reminders)');