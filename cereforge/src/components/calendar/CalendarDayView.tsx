import React from 'react';
import { motion } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';
import { Clock, MapPin, Users } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar.types';

interface CalendarDayViewProps {
  daySelected: Dayjs;
  filteredEvents: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (time: string) => void;
}

const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  daySelected,
  filteredEvents,
  onEventClick,
  onTimeSlotClick
}) => {
  // Generate time slots from 12 AM (00:00) to 11 PM (23:00)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    // Use a fixed base date to avoid "Invalid Date" issues
    return dayjs('2000-01-01').hour(hour).minute(0).format('HH:mm');
  });

  // Get events for the selected day
  const dayEvents = filteredEvents.filter(
    evt => dayjs(evt.day).format('YYYY-MM-DD') === daySelected.format('YYYY-MM-DD')
  );

  const labelColors: Record<string, string> = {
    indigo: 'bg-indigo-500',
    grey: 'bg-gray-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  // Calculate event position and height
  const getEventStyle = (event: CalendarEvent) => {
    if (event.allDay) return null;
    
    const [startHour, startMinute] = event.startTime.split(':').map(Number);
    const [endHour, endMinute] = event.endTime.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    const duration = endInMinutes - startInMinutes;
    
    const top = (startInMinutes / 60) * 80; // 80px per hour
    const height = (duration / 60) * 80;
    
    return { top: `${top}px`, height: `${height}px` };
  };

  const isToday = daySelected.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
  const currentHour = dayjs().hour();

  return (
    <div className="h-full p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full flex flex-col overflow-hidden">
        {/* Day Header */}
        <div className={`px-6 py-4 border-b border-gray-200 ${isToday ? 'bg-gradient-to-r from-orange-50 to-blue-50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {daySelected.format('dddd')}
              </h2>
              <p className="text-gray-600 mt-1">
                {daySelected.format('MMMM D, YYYY')}
              </p>
            </div>
            <div className={`text-center ${isToday ? 'bg-orange-500' : 'bg-blue-600'} text-white rounded-2xl px-6 py-4`}>
              <p className="text-sm font-semibold opacity-90">
                {daySelected.format('ddd')}
              </p>
              <p className="text-4xl font-bold">
                {daySelected.format('D')}
              </p>
            </div>
          </div>
          
          {/* All Day Events */}
          {dayEvents.filter(evt => evt.allDay).length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">All Day</p>
              {dayEvents.filter(evt => evt.allDay).map((evt, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02, x: 4 }}
                  onClick={() => onEventClick(evt)}
                  className={`
                    ${labelColors[evt.label]} text-white px-4 py-3 rounded-xl
                    cursor-pointer shadow-md hover:shadow-lg transition-all
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{evt.event}</span>
                    {evt.location && (
                      <span className="text-xs opacity-90 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {evt.location}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Time Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="relative">
            {/* Time Slots */}
            {timeSlots.map((time, _idx) => {
              const hour = parseInt(time.split(':')[0]);
              const isCurrentHour = isToday && hour === currentHour;
              // Display in 24-hour format for clarity
              const displayTime = time;

              return (
                <motion.div
                  key={time}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                  onClick={() => onTimeSlotClick(time)}
                  className={`
                    flex border-b border-gray-200 cursor-pointer transition-colors
                    ${isCurrentHour ? 'bg-orange-50' : 'hover:bg-gray-50'}
                  `}
                  style={{ height: '80px' }}
                >
                  <div className="w-24 flex-shrink-0 px-4 py-2 text-right border-r border-gray-200">
                    <span className={`text-sm font-semibold ${isCurrentHour ? 'text-orange-600' : 'text-gray-600'}`}>
                      {displayTime}
                    </span>
                  </div>
                  <div className="flex-1 relative">
                    {isCurrentHour && (
                      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-orange-500 z-10">
                        <div className="absolute left-0 w-3 h-3 bg-orange-500 rounded-full -top-1.5"></div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Positioned Events */}
            <div className="absolute top-0 left-24 right-0 pointer-events-none">
              {dayEvents
                .filter(evt => !evt.allDay)
                .map((evt, idx) => {
                  const style = getEventStyle(evt);
                  if (!style) return null;

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02, zIndex: 50 }}
                      onClick={() => onEventClick(evt)}
                      className={`
                        absolute left-2 right-2 ${labelColors[evt.label]}
                        text-white rounded-lg p-3 shadow-lg cursor-pointer
                        pointer-events-auto overflow-hidden
                      `}
                      style={style}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-bold text-sm leading-tight">{evt.event}</p>
                        <Clock className="w-4 h-4 ml-2 flex-shrink-0" />
                      </div>
                      <p className="text-xs opacity-90 mb-1">
                        {evt.startTime} - {evt.endTime}
                      </p>
                      {evt.location && (
                        <p className="text-xs opacity-90 flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {evt.location}
                        </p>
                      )}
                      {evt.selectedGuest && evt.selectedGuest.length > 0 && (
                        <p className="text-xs opacity-90 flex items-center mt-1">
                          <Users className="w-3 h-3 mr-1" />
                          {evt.selectedGuest.length} guest{evt.selectedGuest.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarDayView;