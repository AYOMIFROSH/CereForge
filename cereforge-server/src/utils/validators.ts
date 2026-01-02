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
 * Get pending partners query schema
 */
export const getPendingPartnersQuerySchema = z.object({
  status: z.enum(['pending', 'reviewing', 'approved', 'rejected']).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  sortBy: z.enum(['created_at', 'updated_at', 'company_name']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(), // Search by company name or email
});

/**
 * Update partner application status schema (unified)
 */
export const updatePartnerApplicationStatusSchema = z.discriminatedUnion('status', [
  // Approve application
  z.object({
    status: z.literal('approved'),
    notes: z.string().optional(),
  }),
  // Reject application
  z.object({
    status: z.literal('rejected'),
    reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
  }),
  // Mark as reviewing
  z.object({
    status: z.literal('reviewing'),
  }),
  // Mark as pending
  z.object({
    status: z.literal('pending'),
  }),
]);
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
 * Get partners query schema
 */
export const getPartnersQuerySchema = z.object({
  status: z.enum(['active', 'suspended', 'paused', 'completed']).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  sortBy: z.enum(['created_at', 'updated_at', 'partner_name']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
});

/**
 * Update partner schema
 */

export const updatePartnerSchema = z.object({
  // Partner information
  partner_name: z.string().min(2).max(255).optional(),
  company_website: z.string().url().optional().or(z.literal('')),
  linkedin_profile: z.string().url().optional().or(z.literal('')),
  industry: z.string().max(255).optional(),
  company_size: z.string().max(50).optional(),

  // Project information
  project_title: z.string().min(5).max(255).optional(),
  project_description: z.string().min(50).max(5000).optional(),
  project_stage: z.enum(['idea', 'prototype', 'mvp', 'scaling']).optional(),
  solution_type: z.enum(['software', 'hardware', 'ai', 'fullstack', 'web']).optional(),
  ideal_start_date: z.string().datetime().optional().or(z.literal('')),
  budget_range: z.string().optional(),
  currency: z.enum(['$', '₦', '£', '€']).optional(),
  has_internal_team: z.boolean().optional(),
  schedule_call: z.boolean().optional(),

  // Metadata
  metadata: z.record(z.any()).optional(),
});

/**
 * Custom Recurrence Config Schema (nested)
 */
const customRecurrenceInnerSchema = z.object({
  type: z.literal('custom'),
  interval: z.number().min(1).max(365),
  repeatUnit: z.enum(['day', 'week', 'month', 'year']),
  daysOfWeek: z.array(z.number().min(0).max(6)),
  endType: z.enum(['never', 'on', 'after']),
  endDate: z.string().nullable(),
  occurrences: z.number().min(1).max(1000).nullable()
});

/**
 * Recurrence Configuration Schema (FIXED)
 */
const recurrenceConfigSchema = z.union([
  // Simple recurrence types
  z.object({
    type: z.enum(['none', 'daily', 'weekly', 'monthly', 'annually', 'weekdays'])
  }),
  // Custom recurrence with nested config
  z.object({
    type: z.literal('custom'),
    config: customRecurrenceInnerSchema
  })
]).refine((data) => {
  // Validation only applies to custom type
  if (data.type === 'custom' && 'config' in data) {
    const config = data.config;
    if (config.endType === 'on' && !config.endDate) return false;
    if (config.endType === 'after' && !config.occurrences) return false;
  }
  return true;
}, {
  message: 'Invalid custom recurrence configuration'
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


