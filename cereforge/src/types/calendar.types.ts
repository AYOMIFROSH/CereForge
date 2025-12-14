// src/types/calendar.types.ts - FIXED & UNIFIED
import { Dayjs } from 'dayjs';

// ============================================
// CORE EVENT TYPES (Matches Backend)
// ============================================

export type EventLabel = 'indigo' | 'grey' | 'green' | 'blue' | 'red' | 'purple';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'annually' | 'weekdays' | 'custom';
export type EventStatus = 'active' | 'cancelled' | 'completed';

export interface Guest {
  name: string;
  email: string;
  id?: string;
  response_status?: 'pending' | 'accepted' | 'declined' | 'maybe';
}

export interface NotificationSettings {
  type: 'Email' | 'Number' | 'Snooze';
  interval: number | null;
  timeUnit?: 'Day' | 'Minute' | 'Hour' | null;
  email?: string;
  phone?: string;
  country?: string;
}

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval?: number;
  daysOfWeek?: number[];
  endType?: 'never' | 'on' | 'after';
  endDate?: string | Date;
  occurrences?: number;
  config?: any; // ✅ Added for backend compatibility
}

// ============================================
// MAIN CALENDAR EVENT (Frontend Normalized)
// ============================================

export interface CalendarEvent {
  // IDs
  id: string;
  eventId?: string; // Legacy support
  userId?: string;
  
  // Core Details
  title: string;
  event?: string; // Legacy (maps to title)
  description?: string;
  location?: string;
  
  // Timing (Frontend uses both formats)
  startTime: string; // ISO 8601 OR HH:mm format
  endTime: string; // ISO 8601 OR HH:mm format
  day: number; // Unix timestamp for grouping/filtering
  allDay: boolean;
  timezone: string;
  
  // Recurrence
  recurrenceType?: RecurrenceType;
  recurrence?: RecurrenceConfig;
  recurrenceConfig?: any;
  parentEventId?: string | null;
  isRecurringParent?: boolean;
  
  // Visual
  label: EventLabel;
  
  // Notifications
  notificationSettings?: NotificationSettings;
  notification?: NotificationSettings; // Legacy support
  
  // Guests
  guests?: Guest[];
  selectedGuest?: Guest[]; // Legacy support
  
  // Status
  status?: EventStatus;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  
  // Special flags
  isPublicHoliday?: boolean;
  isEditable?: boolean;
  isInstance?: boolean; // For recurring instances
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  allDay: boolean;
  timezone: string;
  recurrence: {
    type: RecurrenceType;
    config?: RecurrenceConfig;
  };
  label: EventLabel;
  guests?: Guest[];
  sendInvitations?: boolean;
  notification: NotificationSettings;
}

export interface UpdateEventInput {
  id: string;
  title?: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  timezone?: string;
  recurrence?: {
    type: RecurrenceType;
    config?: RecurrenceConfig;
  };
  label?: EventLabel;
  guests?: Guest[];
  notification?: NotificationSettings;
  status?: EventStatus;
}

export interface DeleteEventInput {
  id: string;
  deleteType?: 'single' | 'thisAndFuture' | 'all';
}

export interface PublicHoliday {
  id: string;
  title: string;
  description?: string;
  holidayDate: string; // YYYY-MM-DD
  isRecurring: boolean;
  countries?: string[];
  isActive: boolean;
}

export interface GetEventsParams {
  startDate: string;
  endDate: string;
  includeRecurring?: boolean;
}

export interface CalendarEventsResponse {
  success: boolean;
  data: {
    userEvents: CalendarEvent[];
    publicHolidays: PublicHoliday[];
  };
  timestamp: string;
}

// ============================================
// UI COMPONENT PROPS
// ============================================

export interface LabelFilter {
  label: EventLabel;
  checked: boolean;
}

export interface CalendarSidebarProps {
  monthIndex: number;
  daySelected: Dayjs;
  setDaySelected: (day: Dayjs) => void;
  setSmallCalendarMonth: (month: number) => void;
  onCreateEvent: () => void;
  labels: LabelFilter[];
  updateLabel: (label: LabelFilter) => void;
}

export interface CalendarGridProps {
  monthIndex: number;
  filteredEvents: CalendarEvent[];
  onDayClick: (day: Dayjs) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export interface CalendarDayProps {
  day: Dayjs;
  rowIdx: number;
  events: CalendarEvent[];
  onDayClick: (day: Dayjs) => void;
  onEventClick: (event: CalendarEvent) => void;
  monthIndex: number;
}

export interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  daySelected: Dayjs;
  selectedEvent?: CalendarEvent | null;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
}

// ============================================
// UTILITY TYPES
// ============================================

export const LABEL_COLORS: Record<EventLabel, string> = {
  indigo: '#6366f1',
  grey: '#6b7280',
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
  purple: '#a855f7'
};

export const LABEL_CLASSES: Record<EventLabel, string> = {
  indigo: 'bg-indigo-500',
  grey: 'bg-gray-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500'
};