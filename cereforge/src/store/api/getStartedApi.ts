import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// ✅ GetStarted form data interface
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
  // Optional file URLs (uploaded to Supabase first)
  applicationId?: string;
  projectBriefUrl?: string;
  referenceImagesUrl?: string;
  profilePhotoUrl?: string;
}

export interface GetStartedResponse {
  success: boolean;
  data: {
    applicationId: string;
    message: string;
  };
  timestamp: string;
}

// ✅ Create GetStarted API slice
export const getStartedApi = createApi({
  reducerPath: 'getStartedApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    credentials: 'include'
  }),
  tagTypes: ['Application'],
  endpoints: (builder) => ({
    // POST /public/get-started
    submitGetStarted: builder.mutation<GetStartedResponse, GetStartedFormData>({
      query: (formData) => ({
        url: '/public/get-started',
        method: 'POST',
        body: formData
      }),
      invalidatesTags: ['Application']
    })
  })
});

// ✅ Export hooks
export const {
  useSubmitGetStartedMutation
} = getStartedApi;