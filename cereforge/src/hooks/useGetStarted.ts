import { useState } from 'react';
import api from '../services/api';
import { uploadApplicationFiles, deleteUploadedFiles } from '../services/fileUpload';

// ✅ Import Redux toast action
import { useAppDispatch } from '../store/hook';
import { addToast } from '../store/slices/uiSlice';

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
 * ✅ Hook for Get Started form submission with file uploads
 * Updated with Redux toast notifications
 */
export function useGetStarted() {
  const dispatch = useAppDispatch();  // ✅ NEW
  
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
          
          // ✅ Show toast for file upload
          dispatch(addToast({
            message: 'Uploading files...',
            type: 'info',
            duration: 0  // Keep visible until upload done
          }));

          fileUrls = await uploadApplicationFiles(files);

          setUploadProgress(50);
          console.log('Files uploaded successfully:', fileUrls);
          
          // ✅ Success toast for upload
          dispatch(addToast({
            message: 'Files uploaded successfully!',
            type: 'success'
          }));
        } catch (uploadError: any) {
          console.error('File upload failed:', uploadError);
          setError(`File upload failed: ${uploadError.message}`);
          
          // ✅ Error toast
          dispatch(addToast({
            message: `File upload failed: ${uploadError.message}`,
            type: 'error'
          }));
          
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

      console.log('📤 Sending payload to backend:', payload);

      const response = await api.post('/public/get-started', payload);

      setUploadProgress(100);

      if (response.data.success) {
        setSuccess(true);
        
        // ✅ Success toast
        dispatch(addToast({
          message: 'Application submitted successfully!',
          type: 'success'
        }));
        
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
          
          // ✅ Validation error toast
          dispatch(addToast({
            message: serverError.message,
            type: 'error',
            duration: 8000  // Show longer for validation errors
          }));
        } else {
          setError(serverError.message);
          
          // ✅ Generic error toast
          dispatch(addToast({
            message: serverError.message,
            type: 'error'
          }));
        }
      } else if (err.message) {
        setError(`Network error: ${err.message}`);
        
        // ✅ Network error toast
        dispatch(addToast({
          message: 'Network error. Please check your connection.',
          type: 'error'
        }));
      } else {
        setError('An unexpected error occurred. Please try again.');
        
        // ✅ Generic error toast
        dispatch(addToast({
          message: 'An unexpected error occurred.',
          type: 'error'
        }));
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