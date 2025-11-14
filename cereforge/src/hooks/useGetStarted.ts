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
  const [success, setSuccess] = useState(false);

  const submitApplication = async (formData: GetStartedFormData): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      const response = await api.post('/public/get-started', formData);

      if (response.data.success) {
        setSuccess(true);
        return true;
      }

      return false;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to submit application. Please try again.';
      setError(errorMessage);
      console.error('Get Started submission failed:', err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setError(null);
    setSuccess(false);
  };

  return {
    submitApplication,
    isSubmitting,
    error,
    success,
    resetState
  };
}