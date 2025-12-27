// src/utils/ConsultationConstants.ts

export interface DaySchedule {
  enabled: boolean;
  openTime: string;
  closeTime: string;
}

export interface ConsultationFormData {
  consultationType: string;
  companyName: string;
  duration: string;
  description: string;
  bufferHours: number;
  timezone: string; // ✅ NEW: Creator's timezone
  isActive: boolean; // ✅ NEW: Active/paused status
  schedule: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
  isSystemBooking?: boolean;
}

export const DEFAULT_SCHEDULE: ConsultationFormData['schedule'] = {
  monday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
  tuesday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
  wednesday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
  thursday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
  friday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
  saturday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
  sunday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
};

export const EMPTY_CONSULTATION_FORM: ConsultationFormData = {
  consultationType: '',
  companyName: '',
  duration: '30',
  description: '',
  bufferHours: 48,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // ✅ Default to user's timezone
  isActive: true, // ✅ Default to active
  schedule: { ...DEFAULT_SCHEDULE },
  isSystemBooking: false
};

// ✅ System Booking Consultations (Cereforge default for Admin/Core)
export const SYSTEM_BOOKING_CONSULTATIONS = [
  {
    id: 'discovery' as const,
    title: 'Discovery Call',
    duration: '30 minutes',
    description: 'Initial project discussion and requirements gathering',
    icon: '🎯',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'technical' as const,
    title: 'Technical Review',
    duration: '60 minutes',
    description: 'Deep dive into technical architecture and implementation',
    icon: '⚙️',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'follow-up' as const,
    title: 'Follow-up Meeting',
    duration: '30 minutes',
    description: 'Progress review and next steps discussion',
    icon: '📊',
    color: 'from-orange-500 to-orange-600'
  }
];

// Cereforge default consultation templates (for quick load feature)
export const CEREFORGE_DEFAULT_CONSULTATIONS: Omit<ConsultationFormData, 'companyName'>[] = [
  {
    consultationType: 'Discovery Call',
    duration: '30',
    description: 'Initial project discussion and requirements gathering',
    bufferHours: 48,
    timezone: 'Africa/Lagos', // Default Cereforge timezone
    isActive: true,
    schedule: {
      monday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
      tuesday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
      wednesday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
      thursday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
      friday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
      saturday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
      sunday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
    },
    isSystemBooking: false
  },
  {
    consultationType: 'Technical Review',
    duration: '60',
    description: 'Deep dive into technical architecture and implementation',
    bufferHours: 48,
    timezone: 'Africa/Lagos',
    isActive: true,
    schedule: {
      monday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
      tuesday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
      wednesday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
      thursday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
      friday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
      saturday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
      sunday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
    },
    isSystemBooking: false
  },
  {
    consultationType: 'Follow-up Meeting',
    duration: '30',
    description: 'Progress review and next steps discussion',
    bufferHours: 48,
    timezone: 'Africa/Lagos',
    isActive: true,
    schedule: {
      monday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
      tuesday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
      wednesday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
      thursday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
      friday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
      saturday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
      sunday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
    },
    isSystemBooking: false
  }
];

export const DURATION_OPTIONS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '60 minutes' },
  { value: '90', label: '90 minutes' },
];

export const BUFFER_OPTIONS = [
  { value: 24, label: '24 hours' },
  { value: 48, label: '48 hours' },
  { value: 72, label: '72 hours' },
  { value: 96, label: '96 hours' },
];

export const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];