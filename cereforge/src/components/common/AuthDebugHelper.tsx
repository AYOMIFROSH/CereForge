// src/components/AuthDebugHelper.tsx
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hook';
import { AlertTriangle, CheckCircle, Cookie } from 'lucide-react';

export const AuthDebugHelper = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [requestCheck, setRequestCheck] = useState<{
    hasCookies: boolean;
    lastChecked: string;
    status?: number;
    authenticated?: boolean;
  }>({ hasCookies: false, lastChecked: 'Not checked' });

  useEffect(() => {
    const checkCookies = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        const hasCookies = response.status === 200;
        
        setRequestCheck({
          hasCookies,
          lastChecked: new Date().toLocaleTimeString(),
          status: response.status,
          authenticated: data?.data?.authenticated
        });

        console.log('🍪 Cookie Check:', {
          status: response.status,
          hasCookies,
          authenticated: data?.data?.authenticated,
          reduxAuth: isAuthenticated,
          userEmail: user?.email,
          responseData: data
        });
      } catch (error) {
        console.error('🍪 Cookie Check Error:', error);
        setRequestCheck({
          hasCookies: false,
          lastChecked: new Date().toLocaleTimeString()
        });
      }
    };

    checkCookies();
    const interval = setInterval(checkCookies, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg max-w-md">
      <div className="flex items-start space-x-3">
        {requestCheck.hasCookies ? (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        )}
        
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
            <Cookie className="w-4 h-4" />
            {requestCheck.hasCookies ? '✅ Cookies Working' : '❌ Cookies Not Sent'}
          </h4>
          
          <div className="space-y-1 text-xs">
            <p><strong>Redux Auth:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user?.email || 'None'}</p>
            <p><strong>API Status:</strong> {requestCheck.status || 'N/A'}</p>
            <p><strong>API Says Auth:</strong> {requestCheck.authenticated ? 'Yes' : 'No'}</p>
            <p><strong>Path:</strong> {window.location.pathname}</p>
            <p><strong>Last Checked:</strong> {requestCheck.lastChecked}</p>
            <p className="text-gray-500 italic mt-2">
              ℹ️ httpOnly cookies won't appear in document.cookie (security feature)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
