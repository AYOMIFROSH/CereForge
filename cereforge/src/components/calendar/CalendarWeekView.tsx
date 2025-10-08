import React from 'react';
import { motion } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';
import { Clock, MapPin } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar.types';

interface CalendarWeekViewProps {
  weekStart: Dayjs;
  filteredEvents: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (day: Dayjs) => void;
}

const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  weekStart,
  filteredEvents,
  onEventClick,
  onDayClick
}) => {
  // Generate 7 days of the week
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));

  // Generate time slots from 6 AM (06:00) to 11 PM (23:00)
  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = i + 6;
    // Use a fixed base date to avoid "Invalid Date" issues
    return dayjs('2000-01-01').hour(hour).minute(0).format('HH:mm');
  });

  const labelColors: Record<string, string> = {
    indigo: 'bg-indigo-500',
    grey: 'bg-gray-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  // Get events for a specific day
  const getEventsForDay = (day: Dayjs) => {
    return filteredEvents.filter(
      evt => dayjs(evt.day).format('YYYY-MM-DD') === day.format('YYYY-MM-DD')
    );
  };

  // Calculate event position and height
  const getEventStyle = (event: CalendarEvent) => {
    if (event.allDay) return null;
    
    const [startHour, startMinute] = event.startTime.split(':').map(Number);
    const [endHour, endMinute] = event.endTime.split(':').map(Number);
    
    // Adjust for 6 AM start
    const startInMinutes = (startHour - 6) * 60 + startMinute;
    const endInMinutes = (endHour - 6) * 60 + endMinute;
    const duration = endInMinutes - startInMinutes;
    
    if (startInMinutes < 0) return null; // Event starts before 6 AM
    
    const top = (startInMinutes / 60) * 60; // 60px per hour
    const height = Math.max((duration / 60) * 60, 30); // Minimum 30px height
    
    return { top: `${top}px`, height: `${height}px` };
  };

  const today = dayjs();
  const currentHour = today.hour();

  return (
    <div className="h-full p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full flex flex-col overflow-hidden">
        {/* Week Header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-8">
            {/* Time column header */}
            <div className="py-4 px-2 border-r border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase">Time</span>
            </div>
            
            {/* Day headers */}
            {weekDays.map((day, idx) => {
              const isToday = day.format('YYYY-MM-DD') === today.format('YYYY-MM-DD');
              return (
                <motion.div
                  key={idx}
                  whileHover={{ backgroundColor: '#f3f4f6' }}
                  onClick={() => onDayClick(day)}
                  className={`
                    py-4 text-center border-r border-gray-200 last:border-r-0 cursor-pointer
                    ${isToday ? 'bg-orange-50' : ''}
                  `}
                >
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    {day.format('ddd')}
                  </p>
                  <div
                    className={`
                      w-10 h-10 mx-auto flex items-center justify-center rounded-full text-sm font-bold
                      ${isToday ? 'bg-orange-500 text-white' : 'text-gray-700'}
                    `}
                  >
                    {day.format('D')}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Time Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-8 relative">
            {/* Time column */}
            <div className="border-r border-gray-200">
              {timeSlots.map((time, _idx) => {
                // Display in 24-hour format for clarity
                const displayTime = time;
                return (
                  <div
                    key={time}
                    className="px-2 py-2 text-right border-b border-gray-200"
                    style={{ height: '60px' }}
                  >
                    <span className="text-xs font-semibold text-gray-600">
                      {displayTime}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Day columns with events */}
            {weekDays.map((day, dayIdx) => {
              const isToday = day.format('YYYY-MM-DD') === today.format('YYYY-MM-DD');
              const dayEvents = getEventsForDay(day);
              const allDayEvents = dayEvents.filter(evt => evt.allDay);
              const timedEvents = dayEvents.filter(evt => !evt.allDay);

              return (
                <div key={dayIdx} className="relative border-r border-gray-200 last:border-r-0">
                  {/* Time slots background */}
                  {timeSlots.map((time, _idx) => {
                    const hour = parseInt(time.split(':')[0]);
                    const isCurrentHour = isToday && hour === currentHour;
                    
                    return (
                      <motion.div
                        key={time}
                        whileHover={{ backgroundColor: '#f9fafb' }}
                        onClick={() => onDayClick(day)}
                        className={`
                          border-b border-gray-200 cursor-pointer transition-colors
                          ${isCurrentHour ? 'bg-orange-50' : 'hover:bg-gray-50'}
                        `}
                        style={{ height: '60px' }}
                      >
                        {isCurrentHour && (
                          <div className="absolute left-0 right-0 h-0.5 bg-orange-500 z-10">
                            <div className="absolute left-0 w-2 h-2 bg-orange-500 rounded-full -top-1"></div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* All-day events at top */}
                  {allDayEvents.length > 0 && (
                    <div className="absolute top-0 left-1 right-1 z-20 space-y-1">
                      {allDayEvents.slice(0, 2).map((evt, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(evt);
                          }}
                          className={`
                            ${labelColors[evt.label]} text-white text-xs px-2 py-1 rounded
                            truncate cursor-pointer shadow-sm hover:shadow-md transition-all
                          `}
                        >
                          {evt.event}
                        </motion.div>
                      ))}
                      {allDayEvents.length > 2 && (
                        <div className="text-xs text-blue-600 font-semibold px-2">
                          +{allDayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timed events positioned absolutely */}
                  <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ paddingTop: allDayEvents.length > 0 ? '60px' : '0' }}>
                    {timedEvents.map((evt, idx) => {
                      const style = getEventStyle(evt);
                      if (!style) return null;

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.05, zIndex: 50 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(evt);
                          }}
                          className={`
                            absolute left-1 right-1 ${labelColors[evt.label]}
                            text-white rounded-lg p-2 shadow-md cursor-pointer
                            pointer-events-auto overflow-hidden text-xs
                          `}
                          style={style}
                        >
                          <p className="font-bold leading-tight truncate">{evt.event}</p>
                          <p className="opacity-90 text-[10px] flex items-center mt-0.5">
                            <Clock className="w-2.5 h-2.5 mr-0.5" />
                            {evt.startTime}
                          </p>
                          {evt.location && (
                            <p className="opacity-90 text-[10px] flex items-center truncate mt-0.5">
                              <MapPin className="w-2.5 h-2.5 mr-0.5" />
                              {evt.location}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarWeekView;