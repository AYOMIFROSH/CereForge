import { z } from 'zod';

/**
 * Email verification schema
 */
export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address')
});

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['core', 'admin', 'partner']).optional()
});

/**
 * Password change schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character')
});

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character')
});

/**
 * Get Started form schema
 */
export const getStartedSchema = z.object({
  // Personal Info
  fullName: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().regex(/^[\d\s\+\-\(\)]+$/),

  // Company Info
  companyName: z.string().min(2).max(255),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  linkedinProfile: z.string().url().optional().or(z.literal('')),

  // Project Details
  projectTitle: z.string().min(5).max(255),
  projectDescription: z.string().min(50).max(5000),
  projectStage: z.enum(['idea', 'prototype', 'mvp', 'scaling']),
  solutionType: z.enum(['software', 'hardware', 'ai', 'fullstack', 'web']),

  // Timeline & Budget
  idealStartDate: z.string().datetime().optional().or(z.literal('')),
  budgetRange: z.string().min(1),
  currency: z.enum(['$', '₦', '£', '€']).default('₦'),

  // Collaboration
  hasInternalTeam: z.boolean(),

  scheduleCall: z.boolean(),

  // Legal
  termsAccepted: z.literal(true),
  contactConsent: z.literal(true),

  // ✅ File URLs (Optional - only present if files uploaded)
  projectBriefUrl: z.string().optional(),
  referenceImagesUrl: z.string().optional(),
  profilePhotoUrl: z.string().optional()
});
/**
 * Partner approval schema
 */
export const approvePartnerSchema = z.object({
  notes: z.string().optional()
});

/**
 * Partner rejection schema
 */
export const rejectPartnerSchema = z.object({
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters')
});

/**
 * Update partner status schema
 */
export const updatePartnerStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'paused', 'completed'])
});

/**
 * Validate request body against schema
 */
export function validate<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw error;
      }
      throw new Error('Validation failed');
    }
  };
}

/**
 * Recurrence Configuration Schema
 */
const recurrenceConfigSchema = z.object({
  type: z.enum(['none', 'daily', 'weekly', 'monthly', 'annually', 'weekdays', 'custom']),
  interval: z.number().min(1).max(365).optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  endType: z.enum(['never', 'on', 'after']).optional(),
  endDate: z.string().datetime().optional(),
  occurrences: z.number().min(1).max(1000).optional()
}).refine((data) => {
  // If endType is 'on', endDate is required
  if (data.endType === 'on' && !data.endDate) {
    return false;
  }
  // If endType is 'after', occurrences is required
  if (data.endType === 'after' && !data.occurrences) {
    return false;
  }
  return true;
}, {
  message: 'Invalid recurrence configuration'
});

/**
 * Notification Settings Schema
 */
const notificationSettingsSchema = z.object({
  type: z.enum(['Email', 'Number', 'Snooze']),
  interval: z.number().nullable(),
  timeUnit: z.enum(['Day', 'Minute', 'Hour']).nullable(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  country: z.string().optional()
});

/**
 * Event Guest Schema
 */
const eventGuestSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Guest name is required').max(255)
});

/**
 * Create Calendar Event Schema
 */
export const createCalendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional(),
  location: z.string().max(255).optional(),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format'),
  allDay: z.boolean().default(false),
  timezone: z.string().min(1, 'Timezone is required'),
  recurrence: recurrenceConfigSchema.default({ type: 'none' }),
  label: z.enum(['indigo', 'grey', 'green', 'blue', 'red', 'purple']).default('blue'),
  notificationSettings: notificationSettingsSchema.default({
    type: 'Snooze',
    interval: null,
    timeUnit: null
  }),
  guests: z.array(eventGuestSchema).optional().default([]),
  sendInvitations: z.boolean().default(false)
}).refine((data) => {
  // Validate end time is after start time
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['endTime']
});

/**
 * Update Calendar Event Schema
 */
export const updateCalendarEventSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  location: z.string().max(255).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  timezone: z.string().optional(),
  recurrence: recurrenceConfigSchema.optional(),
  label: z.enum(['indigo', 'grey', 'green', 'blue', 'red', 'purple']).optional(),
  notificationSettings: notificationSettingsSchema.optional(),
  status: z.enum(['active', 'cancelled', 'completed']).optional()
}).refine((data) => {
  // If both startTime and endTime are provided, validate
  if (data.startTime && data.endTime) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return end > start;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['endTime']
});
/**
 * Get Events Query Schema
 */
export const getEventsQuerySchema = z.object({
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  includeRecurring: z.string().optional() // ✅ Add this - don't transform, just allow it
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate']
});
/**
 * Delete Event Query Schema
 */
export const deleteEventQuerySchema = z.object({
  deleteType: z.enum(['single', 'thisAndFuture', 'all']).default('single')
});

/**
 * Create Public Holiday Schema (Admin only)
 */
export const createPublicHolidaySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional(),
  holidayDate: z.string().datetime('Invalid date format'),
  isRecurring: z.boolean().default(true),
  countries: z.array(z.string()).optional()
});

/**
 * Get Public Holidays Query Schema
 */
export const getPublicHolidaysQuerySchema = z.object({
  year: z.coerce.number().optional(),
  country: z.string().optional()
});