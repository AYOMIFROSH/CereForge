import { useEffect, useRef } from 'react';
import { useAppDispatch } from '../store/hook';
import { setOnlineStatus, setSlowConnection } from '../store/slices/uiSlice';
import { addToast } from '../store/slices/uiSlice';

/**
 * ✅ Network Monitor Component
 * Monitors network status and connection speed (Africa-focused)
 * Only shows notifications for online/offline status changes
 */
export function NetworkMonitor() {
  const dispatch = useAppDispatch();
  const isOnlineRef = useRef(navigator.onLine); // Track initial online status

  useEffect(() => {
    // ✅ Monitor online/offline status - ONLY show these notifications
    const handleOnline = () => {
      isOnlineRef.current = true;
      dispatch(setOnlineStatus(true));
      dispatch(addToast({
        message: 'Connection restored',
        type: 'success',
        duration: 3000
      }));
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      dispatch(setOnlineStatus(false));
      dispatch(addToast({
        message: 'No internet connection',
        type: 'error',
        duration: 0 // Keep visible until reconnected
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // ✅ Detect slow connection (Network Information API) - SILENT, no toast
    const checkConnectionSpeed = () => {
      // @ts-ignore - Network Information API
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        const { effectiveType, downlink } = connection;
        
        // ✅ Slow connection: 2G, slow-2g, or downlink < 1 Mbps
        const isSlow = 
          effectiveType === 'slow-2g' || 
          effectiveType === '2g' || 
          (downlink && downlink < 1);
        
        // ✅ Update state silently (no toast notification)
        dispatch(setSlowConnection(isSlow));
      }
    };

    // Check on mount
    checkConnectionSpeed();

    // Check periodically (every 30 seconds)
    const interval = setInterval(checkConnectionSpeed, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [dispatch]);

  return null; // No UI, just monitors in background
}