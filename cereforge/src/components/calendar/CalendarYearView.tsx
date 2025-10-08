import React from 'react';
import { motion } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent } from '@/types/calendar.types';

interface CalendarYearViewProps {
  year: number;
  filteredEvents: CalendarEvent[];
  onDayClick: (day: Dayjs) => void;
  onMonthClick: (monthIndex: number) => void;
}

const CalendarYearView: React.FC<CalendarYearViewProps> = ({
  year,
  filteredEvents,
  onDayClick,
  onMonthClick
}) => {
  const months = Array.from({ length: 12 }, (_, i) => i);
  
  // Generate mini calendar for a month
  const getMonthDays = (monthIndex: number): Dayjs[][] => {
    const firstDayOfMonth = dayjs(new Date(year, monthIndex, 1)).day();
    let currentMonthCount = 0 - firstDayOfMonth;

    const daysMatrix = new Array(6).fill([]).map(() => {
      return new Array(7).fill(null).map(() => {
        currentMonthCount++;
        return dayjs(new Date(year, monthIndex, currentMonthCount));
      });
    });

    return daysMatrix;
  };

  // Count events for a specific day
  const getEventCountForDay = (day: Dayjs): number => {
    return filteredEvents.filter(
      evt => dayjs(evt.day).format('YYYY-MM-DD') === day.format('YYYY-MM-DD')
    ).length;
  };

  // Count events for a specific month
  const getEventCountForMonth = (monthIndex: number): number => {
    return filteredEvents.filter(evt => {
      const eventDate = dayjs(evt.day);
      return eventDate.month() === monthIndex && eventDate.year() === year;
    }).length;
  };

  const today = dayjs();

  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Year Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">{year}</h1>
          <p className="text-gray-600">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} this year
          </p>
        </div>

        {/* 12 Month Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {months.map((monthIndex) => {
            const monthDays = getMonthDays(monthIndex);
            const monthName = dayjs(new Date(year, monthIndex, 1)).format('MMMM');
            const eventCount = getEventCountForMonth(monthIndex);
            const isCurrentMonth = today.year() === year && today.month() === monthIndex;

            return (
              <motion.div
                key={monthIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: monthIndex * 0.05 }}
                className={`
                  bg-white rounded-xl shadow-md border-2 overflow-hidden
                  hover:shadow-xl transition-all cursor-pointer
                  ${isCurrentMonth ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'}
                `}
              >
                {/* Month Header */}
                <motion.div
                  whileHover={{ backgroundColor: '#2563eb' }}
                  onClick={() => onMonthClick(monthIndex)}
                  className={`
                    px-4 py-3 text-center font-bold text-white transition-colors
                    ${isCurrentMonth ? 'bg-orange-500' : 'bg-blue-600'}
                  `}
                >
                  <p className="text-sm">{monthName}</p>
                  {eventCount > 0 && (
                    <p className="text-xs opacity-90 mt-1">
                      {eventCount} event{eventCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </motion.div>

                {/* Mini Calendar */}
                <div className="p-3">
                  {/* Week day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={i} className="text-center text-xs font-semibold text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="space-y-1">
                    {monthDays.map((week, weekIdx) => (
                      <div key={weekIdx} className="grid grid-cols-7 gap-1">
                        {week.map((day, dayIdx) => {
                          const isToday = day.format('YYYY-MM-DD') === today.format('YYYY-MM-DD');
                          const isCurrentMonthDay = day.month() === monthIndex;
                          const eventCount = getEventCountForDay(day);
                          const hasEvents = eventCount > 0;

                          return (
                            <motion.button
                              key={dayIdx}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isCurrentMonthDay) {
                                  onDayClick(day);
                                }
                              }}
                              className={`
                                relative aspect-square flex items-center justify-center text-xs font-medium
                                rounded-md transition-all
                                ${!isCurrentMonthDay ? 'text-gray-300' : ''}
                                ${isToday ? 'bg-orange-500 text-white font-bold' : ''}
                                ${!isToday && isCurrentMonthDay ? 'text-gray-700 hover:bg-blue-100' : ''}
                                ${!isCurrentMonthDay ? 'cursor-default' : 'cursor-pointer'}
                              `}
                            >
                              {day.format('D')}
                              {hasEvents && isCurrentMonthDay && !isToday && (
                                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                                  {Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
                                    <div
                                      key={i}
                                      className="w-1 h-1 rounded-full bg-blue-500"
                                    />
                                  ))}
                                </div>
                              )}
                              {hasEvents && isCurrentMonthDay && isToday && (
                                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                                  {Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
                                    <div
                                      key={i}
                                      className="w-1 h-1 rounded-full bg-white"
                                    />
                                  ))}
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Year Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl p-6 border-2 border-blue-200"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Year Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Total Events</p>
              <p className="text-3xl font-bold text-blue-600">{filteredEvents.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Busiest Month</p>
              <p className="text-3xl font-bold text-green-600">
                {months.reduce((max, m) => {
                  const count = getEventCountForMonth(m);
                  return count > getEventCountForMonth(max) ? m : max;
                }, 0) + 1}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Avg per Month</p>
              <p className="text-3xl font-bold text-orange-600">
                {Math.round(filteredEvents.length / 12)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Current Year</p>
              <p className="text-3xl font-bold text-purple-600">
                {today.year() === year ? '✓' : '–'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CalendarYearView;