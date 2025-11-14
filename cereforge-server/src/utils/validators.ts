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
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[\d\s\+\-\(\)]+$/, 'Invalid phone number format'),
  
  // Company Info
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(255),
  companyWebsite: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkedinProfile: z.string().url('Invalid URL').optional().or(z.literal('')),
  
  // Project Details
  projectTitle: z.string().min(5, 'Project title must be at least 5 characters').max(255),
  projectDescription: z.string().min(50, 'Description must be at least 50 characters').max(5000),
  projectStage: z.enum(['idea', 'prototype', 'mvp', 'scaling'], {
    errorMap: () => ({ message: 'Invalid project stage' })
  }),
  solutionType: z.enum(['software', 'hardware', 'ai', 'fullstack', 'web'], {
    errorMap: () => ({ message: 'Invalid solution type' })
  }),
  
  // Timeline & Budget
  idealStartDate: z.string().datetime().optional().or(z.literal('')),
  budgetRange: z.string().min(1, 'Budget range is required'),
  currency: z.enum(['$', '₦', '£', '€']).default('₦'),
  
  // Collaboration
  hasInternalTeam: z.boolean(),
  scheduleCall: z.boolean(),
  
  // Legal
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' })
  }),
  contactConsent: z.literal(true, {
    errorMap: () => ({ message: 'You must consent to be contacted' })
  })
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