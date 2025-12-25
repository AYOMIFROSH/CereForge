import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Video, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import ConsultationBooking from './ConsultationBooking';

type CalendarView = 'day' | 'week' | 'month' | 'year';

interface CalendarHeaderProps {
  monthIndex: number;
  setMonthIndex: (index: number) => void;
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  isNavigating?: boolean;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  monthIndex,
  setMonthIndex,
  currentView,
  onViewChange,
  isNavigating = false
}) => {
  const navigate = useNavigate();
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showConsultation, setShowConsultation] = useState(false);

  const handlePrevMonth = () => {
    setMonthIndex(monthIndex - 1);
  };

  const handleNextMonth = () => {
    setMonthIndex(monthIndex + 1);
  };

  const handleToday = () => {
    setMonthIndex(
      monthIndex === dayjs().month()
        ? monthIndex + Math.random()
        : dayjs().month()
    );
  };

  const viewOptions: { value: CalendarView; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' }
  ];

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-1">
        <div className="flex items-center justify-between">
          {/* Left: Today button and navigation */}
          <div className="flex items-center space-x-4">
             <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToday}
              disabled={isNavigating} // ✅ DISABLE WHILE LOADING
              className="px-4 py-2 border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Today
            </motion.button>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrevMonth}
                disabled={isNavigating} // ✅ DISABLE WHILE LOADING
                className="p-2 border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNavigating ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextMonth}
                disabled={isNavigating} // ✅ DISABLE WHILE LOADING
                className="p-2 border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNavigating ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </motion.button>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 min-w-[200px]">
              {dayjs(new Date(dayjs().year(), monthIndex)).format('MMMM YYYY')}
            </h2>
          </div>

          {/* Right: View selector and Consultation button */}
          <div className="flex items-center space-x-4">
            {/* View Selector Dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowViewDropdown(!showViewDropdown)}
                className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 hover:border-blue-500 rounded-lg font-medium text-gray-700 hover:text-blue-600 transition-all min-w-[120px] justify-between"
              >
                <span className="capitalize">{currentView}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showViewDropdown ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {showViewDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-40 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
                  >
                    {viewOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        whileHover={{ backgroundColor: '#EFF6FF' }}
                        onClick={() => {
                          onViewChange(option.value);
                          setShowViewDropdown(false);
                        }}
                        className={`
                          w-full text-left px-4 py-3 transition-colors
                          ${currentView === option.value ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'}
                        `}
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Book Consultation Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowConsultation(true)}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold shadow-lg transition-all"
            >
              <Video className="w-5 h-5" />
              <span>Book Consultation</span>
            </motion.button>

            {/* Calendar Icon (optional - for navigation) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="p-2 border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-lg transition-all"
              title="Home"
            >
              <Calendar className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Consultation Booking Modal */}
      <ConsultationBooking
        isOpen={showConsultation}
        onClose={() => setShowConsultation(false)}
        mode="popup"
      />
    </>
  );
};

export default CalendarHeader;