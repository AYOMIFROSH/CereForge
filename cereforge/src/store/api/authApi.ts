import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'core' | 'admin' | 'partner';
  systemType: 'SYSTEM_USERS' | 'COMMERCIAL_USERS';
  permissions?: Record<string, boolean>;
}

export interface EmailVerificationResult {
  exists: boolean;
  role?: 'core' | 'admin' | 'partner';
  systemType?: 'SYSTEM_USERS' | 'COMMERCIAL_USERS';
  displayInfo?: {
    partnerName?: string;
    category?: string;
    employeeId?: string;
  };
  accountStatus?: string;
  userId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: 'core' | 'admin' | 'partner';
}

export interface LoginResponse {
  user: User;
}

export interface MeResponse {
  user: User;
  authenticated: boolean;
}

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  credentials: 'include', // ✅ Sends cookies with every request
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    return headers;
  }
});

// ✅ OPTIMIZED: Only retry on network errors, not auth errors
const baseQueryWithRetry = retry(
  async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);
    
    // Don't retry auth errors (401, 403)
    if (result.error?.status === 401 || result.error?.status === 403) {
      retry.fail(result.error);
    }
    
    return result;
  },
  {
    maxRetries: 1 // ✅ Reduced from 2 → faster failure
  }
);

// ✅ Custom error handling with token refresh
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQueryWithRetry(args, api, extraOptions);

  // ✅ Handle 401: Try token refresh ONCE
  if (result.error && result.error.status === 401) {
    console.log('Token expired, attempting refresh...');

    // Try to refresh token
    const refreshResult = await baseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      console.log('Token refreshed, retrying request...');
      result = await baseQueryWithRetry(args, api, extraOptions);
    } else {
      console.log('Token refresh failed, logging out...');
      api.dispatch({ type: 'auth/logout' });

      // Redirect to login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
  }

  return result;
};

// ✅ Create Auth API slice
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'User'],
  // ✅ OPTIMIZED: Longer cache time for auth data
  keepUnusedDataFor: 600, // 10 minutes (was 300)
  refetchOnMountOrArgChange: false, // ✅ Don't auto-refetch (trust cache)
  refetchOnFocus: false, // ✅ Don't refetch on tab focus
  refetchOnReconnect: true, // ✅ Only refetch on reconnect
  endpoints: (builder) => ({
    // POST /auth/verify-email
    verifyEmail: builder.mutation<
      { data: EmailVerificationResult },
      { email: string }
    >({
      query: (body) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body
      })
    }),

    // POST /auth/login
    login: builder.mutation<{ data: LoginResponse }, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials
      }),
      invalidatesTags: ['Auth', 'User']
    }),

    // GET /auth/me (Fast session check)
    getMe: builder.query<{ data: MeResponse }, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
      // ✅ OPTIMIZED: Cache for 10 minutes
      keepUnusedDataFor: 600,
    }),

    // POST /auth/logout
    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST'
      }),
      invalidatesTags: ['Auth', 'User']
    }),

    // POST /auth/refresh
    refreshToken: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST'
      })
    })
  })
});

// ✅ Export hooks
export const {
  useVerifyEmailMutation,
  useLoginMutation,
  useGetMeQuery,
  useLogoutMutation,
  useRefreshTokenMutation
} = authApi;