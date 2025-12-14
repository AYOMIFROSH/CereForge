// src/components/calendar/modals/DayEventsModal.tsx
import React from 'react';
import { Calendar, Clock, MapPin, Users, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';
import { BaseModal, ModalHeader, ScrollableContent } from './ModalsUtils';
import type { CalendarEvent } from '@/types/calendar.types';

interface DayEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: Dayjs;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const DayEventsModal: React.FC<DayEventsModalProps> = ({
  isOpen,
  onClose,
  day,
  events,
  onEventClick
}) => {
  const labelColors: Record<string, string> = {
    indigo: 'bg-indigo-500',
    grey: 'bg-gray-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  const isToday = day.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

  // Sort events: all-day first, then by time
  const sortedEvents = [...events].sort((a, b) => {
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    if (a.allDay && b.allDay) return 0;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader
        title={day.format('MMM D, YYYY')}
        subtitle={`${events.length} event${events.length !== 1 ? 's' : ''}`}
        icon={<Calendar className="w-4 h-4 text-white" />}
        onClose={onClose}
        gradient={isToday ? 'from-orange-500 to-orange-600' : 'from-blue-800 to-blue-900'}
      />

      <ScrollableContent maxHeight="400px">
        <div className="p-4">
          {events.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">No events scheduled</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedEvents.map((event, idx) => (
                <motion.div
                  key={event.id || idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ scale: 1.02, x: 2 }}
                  onClick={() => {
                    onEventClick(event);
                    onClose();
                  }}
                  className="group cursor-pointer bg-white border border-gray-200 hover:border-blue-500 rounded-lg p-3 transition-all hover:shadow-md"
                >
                  <div className="flex items-start space-x-2">
                    {/* Color Indicator */}
                    <div className={`w-1 h-full ${labelColors[event.label]} rounded-full flex-shrink-0`} />

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      {/* Title & Edit Icon */}
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {event.title || event.event}
                        </h3>
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="w-3 h-3 text-blue-600 flex-shrink-0" />
                        </motion.div>
                      </div>

                      {/* Time */}
                      <div className="flex items-center space-x-1.5 text-xs text-gray-600 mb-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span className="font-medium">
                          {event.allDay 
                            ? 'All day' 
                            : `${event.startTime} - ${event.endTime}`}
                        </span>
                      </div>

                      {/* Location */}
                      {event.location && (
                        <div className="flex items-center space-x-1.5 text-xs text-gray-600 mb-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}

                      {/* Guests */}
                      {event.guests && event.guests.length > 0 && (
                        <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                          <Users className="w-3 h-3 flex-shrink-0" />
                          <span>
                            {event.guests.length} guest{event.guests.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </ScrollableContent>

      {/* Footer with Quick Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Close
          </button>
          <span className="text-gray-500">
            Click to edit
          </span>
        </div>
      </div>
    </BaseModal>
  );
};

export default DayEventsModal;