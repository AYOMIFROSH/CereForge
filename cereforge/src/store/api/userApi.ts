import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// ✅ Placeholder for future user-related endpoints
export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    credentials: 'include'
  }),
  tagTypes: ['User', 'Profile'],
  endpoints: (builder) => ({
    // Example: GET /user/profile
    getUserProfile: builder.query<any, string>({
      query: (userId) => `/user/${userId}`,
      providesTags: ['Profile']
    })
    
    // Add more user endpoints here as needed
  })
});

export const {
  useGetUserProfileQuery
} = userApi;