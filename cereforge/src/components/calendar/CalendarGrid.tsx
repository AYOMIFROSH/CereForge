import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent } from '@/types/calendar.types';
import DayEventsModal from './modals/DayEventsModals'; //

// ✅ Generate exactly 5 rows to ensure stable height distribution
const getMonth = (month: number = dayjs().month()): Dayjs[][] => {
  const year = dayjs().year();
  const firstDayOfMonth = dayjs(new Date(year, month, 1)).day();
  let currentMonthCount = 0 - firstDayOfMonth;

  const daysMatrix = new Array(5).fill([]).map(() => {
    return new Array(7).fill(null).map(() => {
      currentMonthCount++;
      return dayjs(new Date(year, month, currentMonthCount));
    });
  });

  return daysMatrix;
};

// ============================================
// CALENDAR DAY COMPONENT
// ============================================

interface CalendarDayProps {
  day: Dayjs;
  rowIdx: number;
  events: CalendarEvent[];
  onDayClick: (day: Dayjs) => void;
  onEventClick: (event: CalendarEvent) => void;
  monthIndex: number;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  rowIdx,
  events,
  onDayClick,
  onEventClick,
  monthIndex
}) => {
  // ✅ State to control the Day Modal
  const [showAllEvents, setShowAllEvents] = useState(false);

  const dayEvents = events.filter(evt => {
    return dayjs(evt.day).format('YYYY-MM-DD') === day.format('YYYY-MM-DD');
  });

  const isToday = day.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
  const isCurrentMonth = day.month() === monthIndex;
  
  // ✅ STRICT LIMIT: Show 3 events max. If more, the 4th slot is the "More" button.
  // This keeps the cell height predictable (Header + 3 slots + padding).
  const MAX_VISIBLE_EVENTS = 3; 
  const hasOverflow = dayEvents.length > MAX_VISIBLE_EVENTS;
  // If overflowing, show one less event to make room for the button
  const visibleEvents = hasOverflow ? dayEvents.slice(0, MAX_VISIBLE_EVENTS - 1) : dayEvents;

  const bgColors: Record<string, string> = {
    indigo: 'bg-indigo-600',
    grey: 'bg-gray-600',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600'
  };

  const textColors: Record<string, string> = {
    indigo: 'text-indigo-600',
    grey: 'text-gray-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    red: 'text-red-600',
    purple: 'text-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        relative border-b border-r border-gray-200 bg-white
        ${!isCurrentMonth ? 'bg-gray-50/30' : ''}
        hover:bg-gray-50 transition-colors cursor-pointer group
        flex flex-col
        min-h-0 overflow-hidden /* ✅ Crucial: Prevents expansion */
      `}
      onClick={() => onDayClick(day)}
    >
      {/* Day Header */}
      <div className="flex items-center justify-between px-2 pt-1.5 mb-0.5 shrink-0">
        <div className="flex flex-col items-center">
            {rowIdx === 0 && (
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                {day.format('ddd')}
            </span>
            )}
        </div>
        
        <div
          className={`
            w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold
            ${isToday 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-700 group-hover:bg-gray-200'
            }
            ${!isCurrentMonth ? 'opacity-40' : ''}
          `}
        >
          {day.format('D')}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 px-1 space-y-0.5 overflow-hidden pb-1">
        {visibleEvents.map((evt, idx) => {
           const isBlockEvent = evt.allDay; 
           
           return (
            <motion.div
              key={evt.id || idx}
              onClick={(e) => {
                e.stopPropagation();
                onEventClick(evt);
              }}
              className={`
                px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold truncate cursor-pointer transition-all
                ${isBlockEvent 
                  ? `${bgColors[evt.label] || 'bg-blue-600'} text-white shadow-sm hover:brightness-110`
                  : 'bg-transparent hover:bg-gray-100 text-gray-900'
                }
              `}
              title={evt.title || evt.event}
            >
              {isBlockEvent ? (
                  // Block Style (Holidays)
                  <span>{evt.title || evt.event}</span>
              ) : (
                  // Dot Style (Timed Events)
                  <div className="flex items-center gap-1.5 leading-tight">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${textColors[evt.label] || 'text-blue-600'} bg-current`} />
                      <span className="opacity-90 font-bold shrink-0 hidden xl:inline text-[9px]">
                        {evt.startTime}
                      </span>
                      <span className="truncate">
                        {evt.title || evt.event}
                      </span>
                  </div>
              )}
            </motion.div>
          );
        })}

        {/* ✅ The Modal Trigger Button */}
        {hasOverflow && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="w-full text-left px-2 text-[10px] font-extrabold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-[2px] transition-colors py-0.5"
            onClick={(e) => {
              e.stopPropagation();
              // This triggers the modal to open
              setShowAllEvents(true);
            }}
          >
            {dayEvents.length - visibleEvents.length} more...
          </motion.button>
        )}
      </div>

      {/* Hover Add Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        className="absolute bottom-1 right-1 p-1 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-full shadow-sm z-10"
        onClick={(e) => {
          e.stopPropagation();
          onDayClick(day);
        }}
      >
        <Plus className="w-3.5 h-3.5" />
      </motion.button>

      {/* ✅ The Modal Component */}
      <DayEventsModal
        isOpen={showAllEvents}
        onClose={() => setShowAllEvents(false)}
        day={day}
        events={dayEvents}
        onEventClick={onEventClick}
      />
    </motion.div>
  );
};

// ============================================
// CALENDAR GRID COMPONENT
// ============================================

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
  const [month, setMonth] = useState(getMonth(monthIndex));

  useEffect(() => {
    setMonth(getMonth(monthIndex));
  }, [monthIndex]);

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        {/* Calendar Grid Body - Forced 5 Rows */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5">
          {month.map((row, i) => (
            <React.Fragment key={i}>
              {row.map((day, idx) => (
                <CalendarDay
                  key={`${i}-${idx}`}
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