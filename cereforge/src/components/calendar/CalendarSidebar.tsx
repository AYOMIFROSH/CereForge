import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarSidebarProps } from '@/types/calendar.types'; // ✅

// Utility function
const getMonth = (month: number = dayjs().month()): Dayjs[][] => {
  const year = dayjs().year();
  const firstDayOfMonth = dayjs(new Date(year, month, 1)).day();
  let currentMonthCount = 0 - firstDayOfMonth;

  const daysMatrix = new Array(6).fill([]).map(() => {
    return new Array(7).fill(null).map(() => {
      currentMonthCount++;
      return dayjs(new Date(year, month, currentMonthCount));
    });
  });

  return daysMatrix;
};


const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  monthIndex,
  daySelected,
  setDaySelected,
  setSmallCalendarMonth,
  onCreateEvent,
  labels,
  updateLabel
}) => {
  const [currentMonthIdx, setCurrentMonthIdx] = useState(dayjs().month());
  const [currentMonth, setCurrentMonth] = useState(getMonth());

  useEffect(() => {
    setCurrentMonth(getMonth(currentMonthIdx));
  }, [currentMonthIdx]);

  useEffect(() => {
    setCurrentMonthIdx(monthIndex);
  }, [monthIndex]);

  const handlePrevMonth = () => {
    setCurrentMonthIdx(currentMonthIdx - 1);
  };

  const handleNextMonth = () => {
    setCurrentMonthIdx(currentMonthIdx + 1);
  };

  const getDayClass = (day: Dayjs) => {
    const format = 'DD-MM-YY';
    const nowDay = dayjs().format(format);
    const currDay = day.format(format);
    const slcDay = daySelected && daySelected.format(format);

    if (nowDay === currDay) return 'bg-orange-500 text-white';
    if (currDay === slcDay) return 'bg-blue-600 text-white';
    return 'text-gray-700 hover:bg-blue-100';
  };

  const labelColors: Record<string, string> = {
    indigo: '#6366f1',
    grey: '#6b7280',
    green: '#22c55e',
    blue: '#3b82f6',
    red: '#ef4444',
    purple: '#a855f7'
  };

  return (
    <aside className="hidden lg:flex lg:flex-col w-80 bg-white border-r border-gray-200 h-screen overflow-hidden">
      {/* Cereforge Logo - Fixed at top */}
      <div className="p-2.5 border-b border-gray-200">
        <div className="flex items-center space-x-0.5 mb-2">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm rounded-lg transform -skew-x-12 shadow-lg border border-blue-900/30"></div>
            <span className="text-blue-900 relative z-10 px-3 py-1 font-bold text-xl">CERE</span>
          </div>
          <span className="text-gray-900 font-bold text-xl">FORGE</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Create Event Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateEvent}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-800 text-white rounded-xl font-semibold shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Create Event</span>
          </motion.button>

          {/* Mini Calendar */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">
                {dayjs(new Date(dayjs().year(), currentMonthIdx)).format('MMMM YYYY')}
              </h3>
              <div className="flex items-center space-x-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </motion.button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {currentMonth[0].map((day, i) => (
                <div key={i} className="text-center text-xs font-semibold text-gray-500 py-1">
                  {day.format('dd').charAt(0)}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {currentMonth.map((row, i) => (
                <React.Fragment key={i}>
                  {row.map((day, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSmallCalendarMonth(currentMonthIdx);
                        setDaySelected(day);
                      }}
                      className={`
                        w-8 h-8 text-xs font-medium rounded-lg transition-all
                        ${getDayClass(day)}
                        ${day.month() !== currentMonthIdx ? 'opacity-40' : ''}
                      `}
                    >
                      {day.format('D')}
                    </motion.button>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Labels Filter */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Event Labels</h3>
            <div className="space-y-2">
              {labels.map(({ label: lbl, checked }, idx) => (
                <motion.label
                  key={idx}
                  whileHover={{ x: 4 }}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-all"
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => updateLabel({ label: lbl, checked: !checked })}
                      className="sr-only"
                    />
                    <div
                      className={`
                        w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                        ${checked ? 'border-transparent' : 'border-gray-300'}
                      `}
                      style={{
                        backgroundColor: checked ? labelColors[lbl] : 'transparent'
                      }}
                    >
                      {checked && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{lbl}</span>
                  <div
                    className="ml-auto w-3 h-3 rounded-full"
                    style={{ backgroundColor: labelColors[lbl] }}
                  ></div>
                </motion.label>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl p-4 border border-blue-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Today's Events</span>
                <span className="text-lg font-bold text-blue-800">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">This Week</span>
                <span className="text-lg font-bold text-orange-600">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">This Month</span>
                <span className="text-lg font-bold text-green-600">0</span>
              </div>
            </div>
          </div>

          {/* Consultation CTA */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg cursor-pointer"
          >
            <h4 className="font-bold text-lg mb-2">Need Help?</h4>
            <p className="text-sm text-orange-100 mb-3">
              Schedule a consultation with our team
            </p>
            <button className="w-full px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors">
              Book Now
            </button>
          </motion.div>
        </div>
      </div>
    </aside>
  );
};

export default CalendarSidebar;