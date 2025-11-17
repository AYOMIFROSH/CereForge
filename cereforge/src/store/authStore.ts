import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'core' | 'admin' | 'partner';
  permissions?: Record<string, boolean>;
}

// Email verification result (Step 1 of Smart Login)
export interface EmailVerificationResult {
  exists: boolean;
  role?: 'core' | 'admin' | 'partner';
  displayInfo?: {
    partnerName?: string;
    category?: string;
    employeeId?: string;
  };
  accountStatus?: string;
}

// Auth state interface
interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean; // ✅ Computed from user existence, not persisted
  isLoading: boolean;
  
  // Email verification state (for smart login)
  emailVerified: boolean;
  verificationResult: EmailVerificationResult | null;
  
  // Actions
  setUser: (user: User) => void;
  setEmailVerification: (result: EmailVerificationResult) => void;
  clearEmailVerification: () => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  
  // ✅ NEW: Hydration helper (check if user exists on mount)
  hydrate: () => void;
}

// Create auth store with optimized persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      emailVerified: false,
      verificationResult: null,
      
      // Set user after successful login
      setUser: (user) => set({
        user,
        isAuthenticated: true, // ✅ Derived from user existence
        emailVerified: false,
        verificationResult: null
      }),
      
      // Set email verification result (Step 1 of Smart Login)
      setEmailVerification: (result) => set({
        emailVerified: result.exists,
        verificationResult: result
      }),
      
      // Clear email verification
      clearEmailVerification: () => set({
        emailVerified: false,
        verificationResult: null
      }),
      
      // Logout user
      logout: () => set({
        user: null,
        isAuthenticated: false,
        emailVerified: false,
        verificationResult: null
      }),
      
      // Set loading state
      setLoading: (loading) => set({ isLoading: loading }),
      
      // ✅ NEW: Hydrate authentication state on mount
      // This recalculates isAuthenticated from persisted user
      hydrate: () => {
        const state = get();
        if (state.user) {
          set({ isAuthenticated: true });
        } else {
          set({ isAuthenticated: false });
        }
      }
    }),
    {
      name: 'cereforge-auth', // localStorage key
      partialize: (state) => ({
        // ✅ CRITICAL: Only persist user data, NOT isAuthenticated
        // isAuthenticated is computed from user existence
        user: state.user
        // ❌ REMOVED: isAuthenticated (trust server session instead)
      }),
      
      // ✅ PERFORMANCE: Debounce writes to localStorage
      onRehydrateStorage: () => (state) => {
        // After rehydration, recalculate isAuthenticated
        if (state) {
          state.hydrate();
        }
      }
    }
  )
);