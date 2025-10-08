// calendar.types.ts - Type definitions for Cereforge Calendar
import { Dayjs } from 'dayjs';

// Event Label Types
export type EventLabel = 'indigo' | 'grey' | 'green' | 'blue' | 'red' | 'purple';

// Guest Interface
export interface Guest {
  name: string;
  email: string;
}

// Notification Settings
export interface NotificationSettings {
  type: 'Email' | 'Number' | 'Snooze';
  interval: number | null;
  timeUnit: 'Day' | 'Minute' | 'Hour' | null;
  email?: string;
  phone?: string;
  country?: string;
}

// Recurrence Types
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'annually' | 'weekdays';

export interface RecurrenceCustom {
  type: 'custom';
  label: string;
  repeatEvery: number;
  repeatUnit: 'day' | 'week' | 'month' | 'year';
  repeatOn: number[];
  end: {
    type: 'never' | 'on' | 'after';
    date: Date | null;
    occurrences: number | null;
  };
}

// Main Calendar Event Interface
export interface CalendarEvent {
  eventId: string;
  parentId?: string | null;
  event: string;
  description: string;
  location: string;
  day: number;
  startTime: string;
  endTime: string;
  allDay: boolean;
  label: EventLabel;
  timezone: string;
  recurrence: RecurrenceType | RecurrenceCustom;
  selectedGuest: Guest[];
  userId: string | null;
  notification: NotificationSettings;
  createdAt?: Date;
  updatedAt?: Date;
}

// Label Filter Interface
export interface LabelFilter {
  label: EventLabel;
  checked: boolean;
}

// Consultation Types
export type ConsultationType = 'discovery' | 'technical' | 'follow-up';

export interface ConsultationSlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  available: boolean;
  consultationType: ConsultationType;
}

export interface ConsultationBooking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  slot: ConsultationSlot;
  projectDescription: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt?: Date;
}

// Calendar View Types
export type CalendarView = 'month' | 'week' | 'day';

// Component Props Interfaces
export interface CalendarHeaderProps {
  monthIndex: number;
  setMonthIndex: (index: number) => void;
  onConsultationClick?: () => void;
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

export interface ConsultationBookingProps {
  isOpen: boolean;
  onClose: () => void;
}

// Label Color Mapping
export const LABEL_COLORS: Record<EventLabel, string> = {
  indigo: '#6366f1',
  grey: '#6b7280',
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
  purple: '#a855f7'
};



// Label Tailwind Classes
export const LABEL_CLASSES: Record<EventLabel, string> = {
  indigo: 'bg-indigo-500 text-white',
  grey: 'bg-gray-500 text-white',
  green: 'bg-green-500 text-white',
  blue: 'bg-blue-500 text-white',
  red: 'bg-red-500 text-white',
  purple: 'bg-purple-500 text-white'
};

// Consultation Type Configuration
export interface ConsultationTypeConfig {
  id: ConsultationType;
  title: string;
  duration: string;
  description: string;
  icon: string;
  color: string;
}

export const CONSULTATION_TYPES: ConsultationTypeConfig[] = [
  {
    id: 'discovery',
    title: 'Discovery Call',
    duration: '30 minutes',
    description: 'Initial project discussion and requirements gathering',
    icon: '🎯',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'technical',
    title: 'Technical Review',
    duration: '60 minutes',
    description: 'Deep dive into technical architecture and implementation',
    icon: '⚙️',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'follow-up',
    title: 'Follow-up Meeting',
    duration: '30 minutes',
    description: 'Progress review and next steps discussion',
    icon: '📊',
    color: 'from-orange-500 to-orange-600'
  }
];