import { useState } from 'react';
import api from '../services/api';

export interface GetStartedFormData {
  // Personal & Company Info
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  companyWebsite: string;
  linkedinProfile: string;

  // Project Overview
  projectTitle: string;
  projectDescription: string;
  projectStage: string;
  solutionType: string;

  // Timeline & Budget
  idealStartDate: string;
  budgetRange: string;
  currency: string;

  // Collaboration Preferences
  hasInternalTeam: boolean;
  scheduleCall: boolean;

  // Legal & Consent
  termsAccepted: boolean;
  contactConsent: boolean;
}

/**
 * Hook for Get Started form submission
 */
export function useGetStarted() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ field: string; message: string }> | null>(null);
  const [success, setSuccess] = useState(false);

  const submitApplication = async (formData: GetStartedFormData): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setError(null);
      setValidationErrors(null);
      setSuccess(false);

      const response = await api.post('/public/get-started', formData);

      if (response.data.success) {
        setSuccess(true);
        return true;
      }

      return false;
    } catch (err: any) {
      // ✅ ONLY use server errors - no client-side error creation
      if (err.response?.data?.error) {
        const serverError = err.response.data.error;
        
        // Check if it's a validation error with details
        if (serverError.code === 'VALIDATION_ERROR' && serverError.details) {
          setValidationErrors(serverError.details);
          setError(serverError.message);
        } else {
          // General error from server
          setError(serverError.message);
        }
      } else if (err.message) {
        // Network error or other axios error
        setError(`Network error: ${err.message}`);
      } else {
        // Absolute fallback (should rarely happen)
        setError('An unexpected error occurred. Please try again.');
      }
      
      console.error('Get Started submission error:', err.response?.data || err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setError(null);
    setValidationErrors(null);
    setSuccess(false);
  };

  return {
    submitApplication,
    isSubmitting,
    error,
    validationErrors, // ✅ Field-specific errors from server
    success,
    resetState
  };
}