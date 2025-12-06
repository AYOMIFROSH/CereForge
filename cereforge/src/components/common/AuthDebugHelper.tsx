// src/components/AuthDebugHelper.tsx
// ✅ TEMPORARY: Debug component to check cookie status
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hook';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export const AuthDebugHelper = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [cookieStatus, setCookieStatus] = useState<{
    hasCookies: boolean;
    cookies: string;
  }>({ hasCookies: false, cookies: '' });

  useEffect(() => {
    // Check if cookies exist
    const cookies = document.cookie;
    const hasAuthToken = cookies.includes('authToken');
    const hasRefreshToken = cookies.includes('refreshToken');
    
    setCookieStatus({
      hasCookies: hasAuthToken || hasRefreshToken,
      cookies: cookies || 'No cookies found'
    });

    console.log('🍪 Cookie Debug:', {
      isAuthenticated,
      user: user?.email,
      cookies,
      hasAuthToken,
      hasRefreshToken,
      currentPath: window.location.pathname
    });
  }, [isAuthenticated, user]);

  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg max-w-md">
      <div className="flex items-start space-x-3">
        {cookieStatus.hasCookies ? (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        )}
        
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm mb-2">
            {cookieStatus.hasCookies ? '✅ Cookies Present' : '❌ No Cookies'}
          </h4>
          
          <div className="space-y-1 text-xs">
            <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user?.email || 'None'}</p>
            <p><strong>Path:</strong> {window.location.pathname}</p>
            <p className="break-all"><strong>Cookies:</strong> {cookieStatus.cookies}</p>
          </div>
        </div>
      </div>
    </div>
  );
};