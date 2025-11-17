import { useAuthStore, EmailVerificationResult } from '../store/authStore';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';

/**
 * Custom hook for authentication operations
 * ✅ OPTIMIZED: Includes session validation on mount
 */
export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    emailVerified,
    verificationResult,
    setUser,
    setEmailVerification,
    clearEmailVerification,
    logout: logoutStore,
    setLoading
  } = useAuthStore();

  // ✅ PERFORMANCE: Only validate once per app mount
  const hasValidated = useRef(false);

  /**
   * ✅ NEW: Validate session with server on mount
   * This ensures frontend state syncs with server
   */
  useEffect(() => {
    const validateSession = async () => {
      // ✅ PERFORMANCE: Skip if already validated or no user in localStorage
      if (hasValidated.current || !user) {
        return;
      }

      hasValidated.current = true;
      setLoading(true);

      try {
        // ✅ FAST: /auth/me endpoint (JWT validation only, no DB query)
        const response = await api.get('/auth/me');
        
        if (response.data.success && response.data.data.authenticated) {
          // ✅ Session valid - update user data (in case permissions changed)
          const serverUser = response.data.data.user;
          
          // ✅ PERFORMANCE: Only update if data changed
          if (JSON.stringify(serverUser) !== JSON.stringify(user)) {
            setUser(serverUser);
          }
        }
      } catch (error: any) {
        // ✅ Session invalid (401) - logout handled by axios interceptor
        console.warn('Session validation failed:', error.response?.status);
        
        // ✅ If not 401 (already handled), manually logout
        if (error.response?.status !== 401) {
          logoutStore();
          navigate('/login', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, [user, setUser, logoutStore, navigate, setLoading]);

  /**
   * Step 1 of Smart Login: Verify email
   */
  const verifyEmail = async (email: string): Promise<EmailVerificationResult> => {
    try {
      setLoading(true);
      
      const response = await api.post('/auth/verify-email', { email });
      
      const result: EmailVerificationResult = response.data.data;
      
      // Store verification result in Zustand
      setEmailVerification(result);
      
      return result;
    } catch (error: any) {
      console.error('Email verification failed:', error);
      
      // Return failure result
      const failedResult: EmailVerificationResult = { exists: false };
      setEmailVerification(failedResult);
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2 of Smart Login: Login with password
   */
  const login = async (
    email: string,
    password: string,
    role: 'core' | 'admin' | 'partner'
  ): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await api.post('/auth/login', {
        email,
        password,
        role
      });
      
      const userData = response.data.data.user;
      
      // ✅ Store user in Zustand (tokens in httpOnly cookies)
      setUser(userData);
      
      // ✅ Reset validation flag (allow revalidation on next mount)
      hasValidated.current = false;
      
      // Redirect based on role
      switch (role) {
        case 'core':
          navigate('/core/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'partner':
          navigate('/partner/dashboard');
          break;
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Call logout endpoint (clears cookies on server)
      await api.post('/auth/logout');
      
      // Clear Zustand state
      logoutStore();
      
      // ✅ Reset validation flag
      hasValidated.current = false;
      
      // Redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Still clear local state even if API call fails
      logoutStore();
      hasValidated.current = false;
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (role: 'core' | 'admin' | 'partner'): boolean => {
    return user?.role === role;
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.[permission] === true;
  };

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    emailVerified,
    verificationResult,
    
    // Actions
    verifyEmail,
    login,
    logout,
    clearEmailVerification,
    
    // Helpers
    hasRole,
    hasPermission
  };
}