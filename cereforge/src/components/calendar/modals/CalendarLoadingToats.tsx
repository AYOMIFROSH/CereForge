// src/components/calendar/CalendarLoadingToast.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface CalendarLoadingToastProps {
  isLoading: boolean;
  isFetching: boolean;
  delayMs?: number;
  message?: string;
}

/**
 * ✅ Lightweight loading indicator for calendar navigation
 * - Only shows if loading takes >500ms (prevents flicker)
 * - Bottom-right position (non-intrusive)
 * - Auto-dismisses when done
 * - Smooth fade in/out animations
 */
export const CalendarLoadingToast: React.FC<CalendarLoadingToastProps> = ({
  isLoading,
  isFetching,
  delayMs = 300,
  message = 'Loading events...'
}) => {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    let timeoutId: number;

    if (isLoading || isFetching) {
      // ⚡ Only show toast if loading takes longer than delayMs
      timeoutId = window.setTimeout(() => {
        setShowToast(true);
      }, delayMs);
    } else {
      // ⚡ Hide immediately when done
      setShowToast(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, isFetching, delayMs]);

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 z-50 pointer-events-none"
        >
          <div className="bg-white/95 backdrop-blur-lg border-2 border-blue-200 rounded-xl shadow-2xl px-4 py-3 flex items-center space-x-3">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            
            {/* ✅ Use dynamic message */}
            <span className="text-sm font-semibold text-gray-700">
              {message}
            </span>

            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-blue-400"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CalendarLoadingToast;