import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarSidebarProps } from '@/types/calendar.types';
import PublicHolidayFilter from './PublicHolidayFilter'; // ✅ Import

const getMonth = (month: number = dayjs().month()): Dayjs[][] => {
  const year = dayjs().year();
  const firstDayOfMonth = dayjs(new Date(year, month, 1)).day();
  let currentMonthCount = 0 - firstDayOfMonth;

  // Keep your 5-row logic
  const daysMatrix = new Array(5).fill([]).map(() => {
    return new Array(7).fill(null).map(() => {
      currentMonthCount++;
      return dayjs(new Date(year, month, currentMonthCount));
    });
  });

  return daysMatrix;
};

// ✅ Use standard props interface
const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  monthIndex,
  daySelected,
  setDaySelected,
  setSmallCalendarMonth,
  onCreateEvent,
  labels,
  updateLabel,
  // ✅ Destructure new props
  showHolidays,
  setShowHolidays,
  selectedCountry,
  setSelectedCountry
}) => {
  const [currentMonthIdx, setCurrentMonthIdx] = useState(dayjs().month());
  const [currentMonth, setCurrentMonth] = useState(getMonth());

  useEffect(() => {
    setCurrentMonth(getMonth(currentMonthIdx));
  }, [currentMonthIdx]);

  useEffect(() => {
    setCurrentMonthIdx(monthIndex);
  }, [monthIndex]);

  const handlePrevMonth = () => setCurrentMonthIdx(currentMonthIdx - 1);
  const handleNextMonth = () => setCurrentMonthIdx(currentMonthIdx + 1);

  const getDayClass = (day: Dayjs) => {
    const format = 'DD-MM-YY';
    const nowDay = dayjs().format(format);
    const currDay = day.format(format);
    const slcDay = daySelected && daySelected.format(format);

    if (nowDay === currDay) return 'bg-orange-500 text-white font-bold';
    if (currDay === slcDay) return 'bg-blue-600 text-white font-bold';
    return 'text-gray-700 hover:bg-blue-100';
  };

  const labelColors: Record<string, string> = {
    indigo: '#6366f1', grey: '#6b7280', green: '#22c55e',
    blue: '#3b82f6', red: '#ef4444', purple: '#a855f7'
  };

  return (
    <aside className="hidden lg:flex lg:flex-col w-80 bg-white border-r border-gray-200 h-screen overflow-hidden">
      {/* Header / Logo */}
      <div className="p-2.5 border-b border-gray-200">
        <div className="flex items-center space-x-0.5 mb-2">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm rounded-lg transform -skew-x-12 shadow-lg border border-blue-900/30"></div>
            <span className="text-blue-900 relative z-10 px-3 py-1 font-bold text-xl">CERE</span>
          </div>
          <span className="text-gray-900 font-bold text-xl">FORGE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">
                {dayjs(new Date(dayjs().year(), currentMonthIdx)).format('MMMM YYYY')}
              </h3>
              <div className="flex items-center space-x-1">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft className="w-4 h-4"/></button>
                <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded"><ChevronRight className="w-4 h-4"/></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
               {['S','M','T','W','T','F','S'].map((d,i)=><div key={i} className="text-center text-xs font-bold text-gray-400">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
               {currentMonth.map((row, i) => (
                  <React.Fragment key={i}>
                    {row.map((day, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => { setSmallCalendarMonth(currentMonthIdx); setDaySelected(day); }}
                        className={`w-8 h-8 text-xs font-medium rounded-lg flex items-center justify-center ${getDayClass(day)} ${day.month() !== currentMonthIdx ? 'opacity-30' : ''}`}
                      >
                        {day.format('D')}
                      </button>
                    ))}
                  </React.Fragment>
               ))}
            </div>
          </div>

          {/* Labels */}
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
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked ? 'border-transparent' : 'border-gray-300'}`} style={{ backgroundColor: checked ? labelColors[lbl] : 'transparent' }}>
                      {checked && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 capitalize select-none">{lbl}</span>
                </motion.label>
              ))}
            </div>
          </div>

          {/* ✅ Holiday Filter */}
          <PublicHolidayFilter
            showHolidays={showHolidays}
            onToggleHolidays={() => setShowHolidays(!showHolidays)}
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
          />
        </div>
      </div>
    </aside>
  );
};

export default CalendarSidebar;