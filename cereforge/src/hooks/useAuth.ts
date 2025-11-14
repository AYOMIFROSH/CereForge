import { useAuthStore, EmailVerificationResult } from '../store/authStore';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for authentication operations
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
      
      // Store user in Zustand (tokens are in httpOnly cookies automatically)
      setUser(userData);
      
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
      
      // Redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Still clear local state even if API call fails
      logoutStore();
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