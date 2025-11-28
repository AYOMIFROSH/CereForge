import { useState } from 'react';
import { uploadApplicationFiles, deleteUploadedFiles } from '../services/fileUpload';

// ✅ Import Redux
import { useAppDispatch } from '../store/hook';
import { addToast } from '../store/slices/uiSlice';
import { useSubmitGetStartedMutation } from '../store/api/getStartedApi';

export interface GetStartedFormData {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  companyWebsite: string;
  linkedinProfile: string;
  projectTitle: string;
  projectDescription: string;
  projectStage: string;
  solutionType: string;
  idealStartDate: string;
  budgetRange: string;
  currency: string;
  hasInternalTeam: boolean;
  scheduleCall: boolean;
  termsAccepted: boolean;
  contactConsent: boolean;
}

/**
 * ✅ SIMPLIFIED: Hook for Get Started form
 * Now uses RTK Query (no duplicate Axios)
 */
export function useGetStarted() {
  const dispatch = useAppDispatch();
  
  // ✅ RTK Query mutation (replaces Axios api.post())
  const [submitToBackend, { isLoading: isSubmitting }] = useSubmitGetStartedMutation();
  
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
      setValidationErrors(null);
      setSuccess(false);

      // Step 1: Upload files if provided
      if (files && (files.projectBrief || files.referenceImages || files.profilePhoto)) {
        try {
          setIsUploadingFiles(true);
          setUploadProgress(10);

          console.log('Uploading files to Supabase...');
          
          dispatch(addToast({
            message: 'Uploading files...',
            type: 'info',
            duration: 0
          }));

          fileUrls = await uploadApplicationFiles(files);

          setUploadProgress(50);
          console.log('Files uploaded successfully:', fileUrls);
          
          dispatch(addToast({
            message: 'Files uploaded successfully!',
            type: 'success'
          }));
        } catch (uploadError: any) {
          console.error('File upload failed:', uploadError);
          
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

      // Step 2: Submit form data (RTK Query mutation)
      const payload = {
        ...formData,
        ...(fileUrls && {
          applicationId: fileUrls.applicationId,
          projectBriefUrl: fileUrls.projectBriefUrl || '',
          referenceImagesUrl: fileUrls.referenceImagesUrl || '',
          profilePhotoUrl: fileUrls.profilePhotoUrl || ''
        })
      };

      setUploadProgress(70);
      console.log('📤 Sending payload to backend:', payload);

      // ✅ RTK Query mutation (no Axios!)
      const response = await submitToBackend(payload).unwrap();

      setUploadProgress(100);

      if (response.success) {
        setSuccess(true);
        
        dispatch(addToast({
          message: 'Application submitted successfully!',
          type: 'success'
        }));
        
        return true;
      }

      return false;
    } catch (err: any) {
      // Cleanup uploaded files if submission failed
      if (fileUrls?.applicationId) {
        console.log('Cleaning up uploaded files...');
        await deleteUploadedFiles(fileUrls.applicationId);
      }

      // Handle RTK Query errors
      if (err.data?.error) {
        const serverError = err.data.error;
        
        if (serverError.code === 'VALIDATION_ERROR' && serverError.details) {
          setValidationErrors(serverError.details);
          
          dispatch(addToast({
            message: serverError.message,
            type: 'error',
            duration: 8000
          }));
        } else {
          dispatch(addToast({
            message: serverError.message,
            type: 'error'
          }));
        }
      } else {
        dispatch(addToast({
          message: 'Network error. Please check your connection.',
          type: 'error'
        }));
      }
      
      console.error('Get Started submission error:', err);
      return false;
    } finally {
      setUploadProgress(0);
    }
  };

  const resetState = () => {
    setValidationErrors(null);
    setSuccess(false);
    setUploadProgress(0);
  };

  return {
    submitApplication,
    isSubmitting,
    isUploadingFiles,
    uploadProgress,
    validationErrors,
    success,
    resetState
  };
}