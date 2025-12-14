import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authApi, User } from '../api/authApi';
import type { RootState } from '../store'; // ✅ Import RootState

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isAuthChecked: boolean;
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

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.emailVerified = false;
            state.verificationResult = null;
        },

        setEmailVerification: (state, action: PayloadAction<AuthState['verificationResult']>) => {
            state.verificationResult = action.payload;
            state.emailVerified = action.payload?.exists || false;
        },

        clearEmailVerification: (state) => {
            state.emailVerified = false;
            state.verificationResult = null;
        },

        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.isAuthChecked = true;
            state.emailVerified = false;
            state.verificationResult = null;
        }
    },

    extraReducers: (builder) => {
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

        builder.addMatcher(
            authApi.endpoints.getMe.matchFulfilled,
            (state, { payload }) => {
                console.log('✅ authSlice: GetMe fulfilled', payload.data);
                if (payload.data.authenticated) {
                    state.user = payload.data.user;
                    state.isAuthenticated = true;
                } else {
                    state.user = null;
                    state.isAuthenticated = false;
                }
                state.isAuthChecked = true;
            }
        );

        builder.addMatcher(
            authApi.endpoints.getMe.matchRejected,
            (state, { error }) => {
                console.log('❌ authSlice: GetMe rejected', error);
                state.user = null;
                state.isAuthenticated = false;
                state.isAuthChecked = true;
            }
        );

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

export const {
    setUser,
    setEmailVerification,
    clearEmailVerification,
    logout
} = authSlice.actions;

// ✅ FIXED: Selectors now use RootState
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectIsAuthChecked = (state: RootState) => state.auth.isAuthChecked;
export const selectEmailVerified = (state: RootState) => state.auth.emailVerified;
export const selectVerificationResult = (state: RootState) => state.auth.verificationResult;

export default authSlice.reducer;