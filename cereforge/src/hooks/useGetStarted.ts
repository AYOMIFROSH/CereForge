import { useState } from 'react';
import api from '../services/api';
import { uploadApplicationFiles, deleteUploadedFiles } from '../services/FileUpload';


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
 * Hook for Get Started form submission with file uploads
 */
export function useGetStarted() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ field: string; message: string }> | null>(null);
  const [success, setSuccess] = useState(false);

  const submitApplication = async (
    formData: GetStartedFormData,
    files?: {
      projectBrief?: File | null;
      referenceImages?: File | null;
      profilePhoto?: File | null;
    }
  ): Promise<boolean> => {
      let fileUrls: {
        applicationId: string;
        projectBriefUrl?: string;
        referenceImagesUrl?: string;
        profilePhotoUrl?: string;
      } | null = null;

    try {
      setIsSubmitting(true);
      setError(null);
      setValidationErrors(null);
      setSuccess(false);

      // Step 1: Upload files if provided
      if (files && (files.projectBrief || files.referenceImages || files.profilePhoto)) {
        try {
          setIsUploadingFiles(true);
          setUploadProgress(10);

          console.log('Uploading files to Supabase...');
          fileUrls = await uploadApplicationFiles(files);

          setUploadProgress(50);
          console.log('Files uploaded successfully:', fileUrls);
        } catch (uploadError: any) {
          console.error('File upload failed:', uploadError);
          setError(`File upload failed: ${uploadError.message}`);
          return false;
        } finally {
          setIsUploadingFiles(false);
        }
      }

      setUploadProgress(60);

      // Step 2: Submit form data with file URLs
      const payload = {
        ...formData,
        // Add file URLs if files were uploaded
        ...(fileUrls && {
          applicationId: fileUrls.applicationId,
          projectBriefUrl: fileUrls.projectBriefUrl || null,
          referenceImagesUrl: fileUrls.referenceImagesUrl || null,
          profilePhotoUrl: fileUrls.profilePhotoUrl || null
        })
      };

      setUploadProgress(70);

      const response = await api.post('/public/get-started', payload);

      setUploadProgress(100);

      if (response.data.success) {
        setSuccess(true);
        return true;
      }

      return false;
    } catch (err: any) {
      // If submission failed and files were uploaded, cleanup
      if (fileUrls?.applicationId) {
        console.log('Cleaning up uploaded files due to submission failure...');
        await deleteUploadedFiles(fileUrls.applicationId);
      }

      // Handle server errors
      if (err.response?.data?.error) {
        const serverError = err.response.data.error;
        
        if (serverError.code === 'VALIDATION_ERROR' && serverError.details) {
          setValidationErrors(serverError.details);
          setError(serverError.message);
        } else {
          setError(serverError.message);
        }
      } else if (err.message) {
        setError(`Network error: ${err.message}`);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      console.error('Get Started submission error:', err.response?.data || err);
      return false;
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const resetState = () => {
    setError(null);
    setValidationErrors(null);
    setSuccess(false);
    setUploadProgress(0);
  };

  return {
    submitApplication,
    isSubmitting,
    isUploadingFiles,
    uploadProgress,
    error,
    validationErrors,
    success,
    resetState
  };
}

