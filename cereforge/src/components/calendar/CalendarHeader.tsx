import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Video, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

type CalendarView = 'day' | 'week' | 'month' | 'year';

interface CalendarHeaderProps {
  monthIndex: number;
  setMonthIndex: (index: number) => void;
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  monthIndex,
  setMonthIndex,
  currentView,
  onViewChange
}) => {
  const navigate = useNavigate();
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [isCalendarView, setIsCalendarView] = useState(true);

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

  const handleViewToggle = () => {
    if (isCalendarView) {
      // Switch to consultation
      navigate('/consultation');
    } else {
      // Switch back to calendar
      navigate('/calendar');
    }
    setIsCalendarView(!isCalendarView);
  };

  const viewOptions: { value: CalendarView; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' }
  ];

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-1">
      <div className="flex items-center justify-between">
        {/* Left: Today button and navigation */}
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToday}
            className="px-4 py-2 border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-lg font-medium transition-all"
          >
            Today
          </motion.button>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevMonth}
              className="p-2 border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextMonth}
              className="p-2 border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 min-w-[200px]">
            {dayjs(new Date(dayjs().year(), monthIndex)).format('MMMM YYYY')}
          </h2>
        </div>

        {/* Right: View selector and Calendar/Consultation toggle */}
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

          {/* Calendar/Consultation Toggle Switch */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 border-2 border-gray-300">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewToggle}
              className={`
                flex items-center justify-center px-4 py-2 rounded-lg transition-all
                ${isCalendarView 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-transparent text-gray-600 hover:text-blue-600'
                }
              `}
            >
              <Calendar className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewToggle}
              className={`
                flex items-center justify-center px-4 py-2 rounded-lg transition-all
                ${!isCalendarView 
                  ? 'bg-orange-500 text-white shadow-md' 
                  : 'bg-transparent text-gray-600 hover:text-orange-500'
                }
              `}
            >
              <Video className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CalendarHeader;