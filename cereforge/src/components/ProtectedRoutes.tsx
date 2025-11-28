import { Navigate, useLocation } from 'react-router-dom';

// ✅ Redux hooks
import { useAppSelector } from '../store/hook';
import { selectIsAuthenticated, selectUser } from '../store/slices/authSlice';
import { useGetMeQuery } from '../store/api/authApi';

// ✅ Loading skeleton
import { PageLoadingSkeleton } from './LoadingSkeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'core' | 'admin' | 'partner'>;
  requiredPermission?: string;
}

/**
 * ✅ Protected Route Component with Session Validation
 * - Checks cookies on mount via /auth/me
 * - Shows loading skeleton while validating
 * - Redirects to login if not authenticated
 * - Checks role and permission requirements
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermission
}: ProtectedRouteProps) {
  const location = useLocation();
  
  // ✅ Redux selectors
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // ✅ Validate session with server (checks cookies)
  const { isLoading, isFetching, error } = useGetMeQuery(undefined, {
    // Only run if we don't have user in Redux yet
    skip: isAuthenticated && !!user
  });

  // ✅ Show loading skeleton while validating session
  if (isLoading || isFetching) {
    return <PageLoadingSkeleton />;
  }

  // ✅ Session validation failed (401) - redirect to login
  if (error || !isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Check role if specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Check permission if specified
  if (requiredPermission && !user.permissions?.[requiredPermission]) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ All checks passed - render children
  return <>{children}</>;
}