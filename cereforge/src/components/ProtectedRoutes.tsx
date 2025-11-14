import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'core' | 'admin' | 'partner'>;
  requiredPermission?: string;
}

/**
 * Protected Route Component
 * Redirects to login if not authenticated
 * Redirects to unauthorized if role/permission check fails
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermission
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Not logged in - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role if specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check permission if specified
  if (requiredPermission && !user.permissions?.[requiredPermission]) {
    return <Navigate to="/unauthorized" replace />;
  }

  // All checks passed - render children
  return <>{children}</>;
}