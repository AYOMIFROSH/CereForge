import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hook';
import { selectIsAuthenticated, selectUser, selectIsAuthChecked } from '../store/slices/authSlice';
import { useGetMeQuery } from '../store/api/authApi';
import { useEffect, useRef } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'core' | 'admin' | 'partner'>;
  requiredPermission?: string;
}

/**
 * ✅ OPTIMIZED: Minimal loading UI with professional inline spinner
 */
function MinimalAuthCheck() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {/* Lightweight spinner - no heavy animations */}
        <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-3 text-sm text-gray-600">Verifying access...</p>
      </div>
    </div>
  );
}

/**
 * ✅ OPTIMIZED: Protected Route with smart caching
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermission
}: ProtectedRouteProps) {
  const location = useLocation();
  const hasCheckedRef = useRef(false);
  
  // Redux state (instant, no network)
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const isAuthChecked = useAppSelector(selectIsAuthChecked);

  // ✅ SMART: Only fetch if Redux says NOT authenticated
  // If Redux already has user, skip API call (trust cookie/session)
  const shouldSkipQuery = !!(isAuthenticated && user);
  
  const { isLoading, isFetching, error } = useGetMeQuery(undefined, {
    // ✅ CRITICAL: Only refetch on mount if NO user in Redux
    skip: shouldSkipQuery,
    refetchOnMountOrArgChange: !shouldSkipQuery
  });

  // ✅ Debug logging (only once per mount)
  useEffect(() => {
    if (!hasCheckedRef.current) {
      console.log('🔒 ProtectedRoute:', {
        path: location.pathname,
        skippedQuery: shouldSkipQuery,
        isAuthenticated,
        hasUser: !!user,
        userEmail: user?.email
      });
      hasCheckedRef.current = true;
    }
  }, []);

  // ✅ Fast path: User already in Redux, instant access
  if (shouldSkipQuery) {
    console.log('⚡ Fast path: Using cached auth');
    // user is present on the fast path; create a local non-null reference for TS
    const cachedUser = user as NonNullable<typeof user>;

    // Role check
    if (allowedRoles && !allowedRoles.includes(cachedUser.role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    // Permission check
    if (requiredPermission && !cachedUser.permissions?.[requiredPermission]) {
      return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
  }

  // ✅ Show minimal loading (ONLY if actually fetching)
  if (isLoading || isFetching) {
    console.log('⏳ Checking session...');
    return <MinimalAuthCheck />;
  }

  // If the initial auth check hasn't completed yet, show minimal check UI
  if (!isAuthChecked) {
    return <MinimalAuthCheck />;
  }

  // ✅ Redirect to login if auth failed (only after auth check completes)
  if (error || !isAuthenticated || !user) {
    console.log('❌ Not authenticated, redirecting');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Ensure user is present before performing role/permission checks
  if (!user) {
    // Should be handled above, but guard to satisfy TypeScript and avoid runtime errors
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('❌ Insufficient role');
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Permission check
  if (requiredPermission && !user.permissions?.[requiredPermission]) {
    console.log('❌ Missing permission');
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ Access granted');
  return <>{children}</>;
}