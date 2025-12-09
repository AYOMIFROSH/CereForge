import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authApi, User } from '../api/authApi';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
  // Whether we've performed the initial auth check (getMe)
  isAuthChecked: boolean;

    // Email verification state (Smart Login Step 1)
    emailVerified: boolean;
    verificationResult: {
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
    } | null;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
  isAuthChecked: false,
    emailVerified: false,
    verificationResult: null
};

// ✅ Auth Slice (replaces Zustand authStore)
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Set user after login
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.emailVerified = false;
            state.verificationResult = null;
        },

        // Set email verification result (Smart Login Step 1)
        setEmailVerification: (state, action: PayloadAction<AuthState['verificationResult']>) => {
            state.verificationResult = action.payload;
            state.emailVerified = action.payload?.exists || false;
        },

        // Clear email verification
        clearEmailVerification: (state) => {
            state.emailVerified = false;
            state.verificationResult = null;
        },

        // Logout user
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
          state.isAuthChecked = true;
            state.emailVerified = false;
            state.verificationResult = null;
        }
    },

    // ✅ Handle RTK Query actions automatically
    extraReducers: (builder) => {
  // Handle successful login
  builder.addMatcher(
    authApi.endpoints.login.matchFulfilled,
    (state, { payload }) => {
      console.log('✅ authSlice: Login fulfilled', payload.data.user);
      state.user = payload.data.user;
      state.isAuthenticated = true;
      state.emailVerified = false;
      state.verificationResult = null;
      state.isAuthChecked = true;
    }
  );

  // ✅ CRITICAL: Handle successful getMe
  builder.addMatcher(
    authApi.endpoints.getMe.matchFulfilled,
    (state, { payload }) => {
      console.log('✅ authSlice: GetMe fulfilled', payload.data);
      if (payload.data.authenticated) {
        state.user = payload.data.user;
        state.isAuthenticated = true;
      } else {
        // ✅ If server says not authenticated, clear state
        state.user = null;
        state.isAuthenticated = false;
      }
      state.isAuthChecked = true;
    }
  );

  // ✅ Handle getMe rejection (401, network error, etc.)
  builder.addMatcher(
    authApi.endpoints.getMe.matchRejected,
    (state, { error }) => {
      console.log('❌ authSlice: GetMe rejected', error);
      state.user = null;
      state.isAuthenticated = false;
      state.isAuthChecked = true;
    }
  );

  // Handle logout
  builder.addMatcher(
    authApi.endpoints.logout.matchFulfilled,
    (state) => {
      console.log('✅ authSlice: Logout fulfilled');
      state.user = null;
      state.isAuthenticated = false;
      state.emailVerified = false;
      state.verificationResult = null;
      state.isAuthChecked = true;
    }
  );

  // Handle email verification
  builder.addMatcher(
    authApi.endpoints.verifyEmail.matchFulfilled,
    (state, { payload }) => {
      console.log('✅ authSlice: VerifyEmail fulfilled', payload.data);
      state.verificationResult = payload.data;
      state.emailVerified = payload.data.exists;
    }
  );
}
});

// ✅ Export actions
export const {
    setUser,
    setEmailVerification,
    clearEmailVerification,
    logout
} = authSlice.actions;

// ✅ Export selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsAuthChecked = (state: { auth: AuthState }) => state.auth.isAuthChecked;
export const selectEmailVerified = (state: { auth: AuthState }) => state.auth.emailVerified;
export const selectVerificationResult = (state: { auth: AuthState }) => state.auth.verificationResult;

// ✅ Export reducer
export default authSlice.reducer;