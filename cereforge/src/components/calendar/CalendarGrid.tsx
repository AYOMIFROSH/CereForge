import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent, CalendarDayProps } from '@/types/calendar.types'; // ✅ use the shared types


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

const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  rowIdx,
  events,
  onDayClick,
  onEventClick,
  monthIndex
}) => {
  const dayEvents = events.filter(
    evt => dayjs(evt.day).format('DD-MM-YY') === day.format('DD-MM-YY')
  );

  const isToday = day.format('DD-MM-YY') === dayjs().format('DD-MM-YY');
  const isCurrentMonth = day.month() === monthIndex;
  const MAX_VISIBLE_EVENTS = 2;

  const labelColors: Record<string, string> = {
    indigo: 'bg-indigo-500',
    grey: 'bg-gray-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        relative min-h-[120px] border border-gray-200 p-2 bg-white
        ${!isCurrentMonth ? 'bg-gray-50' : ''}
        hover:bg-blue-50/50 transition-colors cursor-pointer group
      `}
      onClick={() => onDayClick(day)}
    >
      {/* Day Header */}
      <div className="flex items-center justify-between mb-2">
        {rowIdx === 0 && (
          <span className="text-xs font-semibold text-gray-500 uppercase">
            {day.format('ddd')}
          </span>
        )}
        <div
          className={`
            ml-auto w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold
            ${isToday ? 'bg-orange-500 text-white' : 'text-gray-700'}
            ${!isCurrentMonth ? 'opacity-40' : ''}
          `}
        >
          {day.format('D')}
        </div>
      </div>

      {/* Events */}
      <div className="space-y-1">
        {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((evt, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.02, x: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick(evt);
            }}
            className={`
              ${labelColors[evt.label]} text-white text-xs px-2 py-1 rounded
              truncate cursor-pointer shadow-sm hover:shadow-md transition-all
            `}
          >
            {evt.allDay ? evt.event : `${evt.startTime} - ${evt.event}`}
          </motion.div>
        ))}

        {dayEvents.length > MAX_VISIBLE_EVENTS && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-xs text-blue-600 font-semibold cursor-pointer hover:text-blue-800"
          >
            +{dayEvents.length - MAX_VISIBLE_EVENTS} more
          </motion.div>
        )}
      </div>

      {/* Hover Add Button */}
      <motion.button
        initial={{ opacity: 0 }}
        whileHover={{ scale: 1.1 }}
        className="absolute bottom-2 right-2 w-6 h-6 bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation();
          onDayClick(day);
        }}
      >
        <Plus className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
};

interface CalendarGridProps {
  monthIndex: number;
  filteredEvents: CalendarEvent[];
  onDayClick: (day: Dayjs) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  monthIndex,
  filteredEvents,
  onDayClick,
  onEventClick
}) => {
  const [month, setMonth] = useState(getMonth());

  useEffect(() => {
    setMonth(getMonth(monthIndex));
  }, [monthIndex]);

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="p-4 h-full">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-bold text-gray-700 border-r border-gray-200 last:border-r-0"
            >
              <span className="hidden md:inline">{day}</span>
              <span className="md:hidden">{day.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {month.map((row, i) => (
            <React.Fragment key={i}>
              {row.map((day, idx) => (
                <CalendarDay
                  key={idx}
                  day={day}
                  rowIdx={i}
                  events={filteredEvents}
                  onDayClick={onDayClick}
                  onEventClick={onEventClick}
                  monthIndex={monthIndex}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;