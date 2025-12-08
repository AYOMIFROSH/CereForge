import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hook';
import { selectIsAuthenticated, selectUser } from '../store/slices/authSlice';
import { useGetMeQuery } from '../store/api/authApi';
import { PageLoadingSkeleton } from './LoadingSkeleton';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'core' | 'admin' | 'partner'>;
  requiredPermission?: string;
}

/**
 * ✅ FIXED: Protected Route with proper session validation
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermission
}: ProtectedRouteProps) {
  const location = useLocation();
  
  // Redux state
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // ✅ Always call useGetMeQuery to validate session
  const { isLoading, isFetching, error, data } = useGetMeQuery(undefined, {
    // ✅ CRITICAL: Refetch on mount to check cookies
    refetchOnMountOrArgChange: true
  });

  // ✅ Debug logging
  useEffect(() => {
    console.log('🔒 ProtectedRoute Check:', {
      path: location.pathname,
      isLoading,
      isFetching,
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      hasError: !!error,
      hasData: !!data
    });
  }, [isLoading, isFetching, isAuthenticated, user, error, data, location.pathname]);

  // ✅ Show loading skeleton while validating
  if (isLoading || isFetching) {
    console.log('⏳ ProtectedRoute: Validating session...');
    return <PageLoadingSkeleton />;
  }

  // ✅ If API returned error OR Redux says not authenticated, redirect to login
  if (error || !isAuthenticated || !user) {
    console.log('❌ ProtectedRoute: Not authenticated, redirecting to login', {
      error: error,
      isAuthenticated,
      hasUser: !!user
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Check role if specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('❌ ProtectedRoute: Insufficient role', {
      userRole: user.role,
      allowedRoles
    });
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Check permission if specified
  if (requiredPermission && !user.permissions?.[requiredPermission]) {
    console.log('❌ ProtectedRoute: Missing permission', {
      requiredPermission,
      userPermissions: user.permissions
    });
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ All checks passed
  console.log('✅ ProtectedRoute: Access granted', {
    userEmail: user.email,
    userRole: user.role
  });
  
  return <>{children}</>;
}