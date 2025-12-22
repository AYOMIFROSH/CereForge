// src/types/calendar.types.ts
// =====================================================
// CEREFORGE CALENDAR TYPE DEFINITIONS
// Fast-scaling production types
// =====================================================

/**
 * Event Label Colors
 */
export type EventLabel = 'indigo' | 'grey' | 'green' | 'blue' | 'red' | 'purple';

/**
 * Recurrence Types
 */
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'annually' | 'weekdays' | 'custom';

/**
 * Event Status
 */
export type EventStatus = 'active' | 'cancelled' | 'completed';

/**
 * Guest Response Status
 */
export type GuestResponseStatus = 'pending' | 'accepted' | 'declined' | 'maybe';

/**
 * Reminder Type
 */
export type ReminderType = 'email' | 'push' | 'sms';

/**
 * Recurrence Configuration
 */
export interface RecurrenceConfig {
  type: RecurrenceType;
  interval?: number;
  repeatUnit?: 'day' | 'week' | 'month' | 'year'; // ✅ NEW
  daysOfWeek?: number[];
  endType?: 'never' | 'on' | 'after';
  endDate?: string | Date;
  occurrences?: number;
  config?: any;
  
  // ✅ For legacy custom recurrence modal
  repeatEvery?: number;
  repeatOn?: number[];
  end?: {
    type: 'never' | 'on' | 'after';
    date: Date | null;
    occurrences: number | null;
  };
}

/**
 * Notification Settings
 */
export interface NotificationSettings {
  type: 'Email' | 'Number' | 'Snooze';
  interval: number | null;
  timeUnit: 'Day' | 'Minute' | 'Hour' | null;
  email?: string;
  phone?: string;
  country?: string;
}

/**
 * Event Guest
 */
export interface EventGuest {
  id: string;
  event_id: string;
  email: string;
  name: string;
  invitation_sent: boolean;
  invitation_sent_at?: Date | string;
  response_status: GuestResponseStatus;
  responded_at?: Date | string;
  created_at: Date | string;
}

/**
 * Calendar Event (Database Model)
 */
export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  location?: string;
  start_time: Date | string; // UTC
  end_time: Date | string; // UTC
  all_day: boolean;
  timezone: string; // User's timezone
  recurrence_type: RecurrenceType;
  recurrence_config?: RecurrenceConfig;
  parent_event_id?: string | null;
  is_recurring_parent: boolean;
  label: EventLabel;
  notification_settings: NotificationSettings;
  status: EventStatus;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at?: Date | string;
  // Joined data
  guests?: EventGuest[];
}

/**
 * Public Holiday
 */
export interface PublicHoliday {
  id: string;
  title: string;
  description?: string;
  holiday_date: Date | string; // MM-DD format for recurring
  is_recurring: boolean;
  countries?: string[]; // ['NG', 'US', 'UK'] - NULL means global
  created_by?: string;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

/**
 * Event Reminder
 */
export interface EventReminder {
  id: string;
  event_id: string;
  user_id: string;
  remind_at: Date | string;
  sent: boolean;
  sent_at?: Date | string;
  reminder_type: ReminderType;
  created_at: Date | string;
}

/**
 * Create Event Input
 */
export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  allDay: boolean;
  timezone: string;
  recurrence: RecurrenceConfig;
  label: EventLabel;
  notificationSettings: NotificationSettings;
  guests?: { email: string; name: string }[];
  sendInvitations?: boolean;
}

/**
 * Update Event Input
 */
export interface UpdateEventInput {
  title?: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  timezone?: string;
  recurrence?: RecurrenceConfig;
  label?: EventLabel;
  notificationSettings?: NotificationSettings;
  status?: EventStatus;
}

/**
 * Delete Event Options
 */
export type DeleteEventType = 'single' | 'thisAndFuture' | 'all';

/**
 * Get Events Query Params
 */
export interface GetEventsParams {
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  includeRecurring?: boolean;
}

/**
 * Calendar Events Response
 */
export interface CalendarEventsResponse {
  userEvents: CalendarEvent[];
  publicHolidays: PublicHoliday[];
}

/**
 * Create Public Holiday Input (Admin only)
 */
export interface CreatePublicHolidayInput {
  title: string;
  description?: string;
  holidayDate: string; // ISO 8601 date
  isRecurring: boolean;
  countries?: string[];
}

/**
 * Expanded Recurring Event Instance
 */
export interface RecurringEventInstance extends CalendarEvent {
  isInstance: true;
  instanceDate: Date | string;
  instanceIndex: number;
}