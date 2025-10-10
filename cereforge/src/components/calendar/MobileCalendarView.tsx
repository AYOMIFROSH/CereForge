import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Menu, Search, Plus, Calendar, Inbox, Clock, MapPin, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent } from '@/types/calendar.types';

interface MobileCalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (day: Dayjs) => void;
  onCreateEvent: () => void;
  daySelected: Dayjs;
}

type TabView = 'today' | 'calendars' | 'inbox';

const MobileCalendarView: React.FC<MobileCalendarViewProps> = ({
  events,
  onEventClick,
  onDayClick,
  onCreateEvent,
  daySelected: initialDaySelected
}) => {
  const [currentView, setCurrentView] = useState<TabView>('calendars');
  const [selectedDate, setSelectedDate] = useState<Dayjs>(initialDaySelected);
  const [currentYear] = useState(dayjs().year());
  const [showYearView, setShowYearView] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const yearViewRef = useRef<HTMLDivElement>(null);

  const labelColors: Record<string, string> = {
    blue: '#3b82f6',
    green: '#22c55e',
    orange: '#f97316',
    purple: '#a855f7',
    red: '#ef4444',
    indigo: '#6366f1',
    grey: '#6b7280'
  };

  // Generate year calendar months
  const getMonthDays = (monthIndex: number): Dayjs[][] => {
    const firstDayOfMonth = dayjs(new Date(currentYear, monthIndex, 1)).day();
    let currentMonthCount = 0 - firstDayOfMonth;

    const daysMatrix = new Array(6).fill([]).map(() => {
      return new Array(7).fill(null).map(() => {
        currentMonthCount++;
        return dayjs(new Date(currentYear, monthIndex, currentMonthCount));
      });
    });

    return daysMatrix;
  };

  // Search events
  const searchEvents = (query: string): CalendarEvent[] => {
    if (!query.trim()) return events;
    
    const lowerQuery = query.toLowerCase();
    return events.filter(evt => 
      evt.event.toLowerCase().includes(lowerQuery) ||
      evt.description?.toLowerCase().includes(lowerQuery) ||
      evt.location?.toLowerCase().includes(lowerQuery)
    );
  };

  const filteredEvents = searchQuery ? searchEvents(searchQuery) : events;

  // Get events for a specific date
  const getEventsForDate = (date: Dayjs): CalendarEvent[] => {
    return filteredEvents.filter(
      evt => dayjs(evt.day).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
    );
  };

  // Check if date has events
  const hasEvents = (date: Dayjs): boolean => {
    return events.some(evt => dayjs(evt.day).format('YYYY-MM-DD') === date.format('YYYY-MM-DD'));
  };

  // Group events by date
  const getGroupedEvents = (): { date: Dayjs; events: CalendarEvent[] }[] => {
    const grouped: { [key: string]: CalendarEvent[] } = {};
    
    filteredEvents.forEach(event => {
      const dateKey = dayjs(event.day).format('YYYY-MM-DD');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return Object.keys(grouped)
      .sort()
      .map(dateKey => ({
        date: dayjs(dateKey),
        events: grouped[dateKey].sort((a, b) => {
          if (a.allDay && !b.allDay) return -1;
          if (!a.allDay && b.allDay) return 1;
          return a.startTime.localeCompare(b.startTime);
        })
      }));
  };

  const handleDateClick = (date: Dayjs) => {
    setSelectedDate(date);
    setShowYearView(false);
    onDayClick(date);
  };

  const handleCreateEvent = () => {
    onCreateEvent();
  };

  const handleEventClick = (event: CalendarEvent) => {
    onEventClick(event);
  };

  const handleToggleYearView = () => {
    setShowYearView(!showYearView);
  };

  const handleToggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  // Scroll to current month when year view opens
  useEffect(() => {
    if (showYearView && yearViewRef.current) {
      setTimeout(() => {
        const currentMonthElement = document.getElementById(`month-${dayjs().month()}`);
        if (currentMonthElement) {
          currentMonthElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [showYearView]);

  // Generate time slots for day view (6 AM to 11 PM)
  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = i + 6;
    return dayjs('2000-01-01').hour(hour).minute(0).format('HH:mm');
  });

  // Calculate event position for day view
  const getEventStyle = (event: CalendarEvent) => {
    if (event.allDay) return null;
    
    const [startHour, startMinute] = event.startTime.split(':').map(Number);
    const [endHour, endMinute] = event.endTime.split(':').map(Number);
    
    const startInMinutes = (startHour - 6) * 60 + startMinute;
    const endInMinutes = (endHour - 6) * 60 + endMinute;
    const duration = endInMinutes - startInMinutes;
    
    if (startInMinutes < 0) return null;
    
    const top = (startInMinutes / 60) * 60;
    const height = Math.max((duration / 60) * 60, 30);
    
    return { top: `${top}px`, height: `${height}px` };
  };

  const today = dayjs();
  const currentHour = today.hour();

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-black border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="text-red-500"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            <h1 className="text-red-500 text-xl font-semibold">
              {showYearView 
                ? currentYear.toString()
                : currentView === 'today' 
                ? selectedDate.format('MMMM D, YYYY')
                : selectedDate.format('MMMM')}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleYearView}
              className={`p-2 rounded-lg transition-colors ${
                showYearView ? 'bg-red-500 text-white' : 'text-red-500'
              }`}
            >
              <Menu className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleSearch}
              className={`p-2 transition-colors ${
                showSearch ? 'text-white' : 'text-red-500'
              }`}
            >
              <Search className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateEvent}
              className="p-2"
            >
              <Plus className="w-5 h-5 text-red-500" />
            </motion.button>
          </div>
        </div>

        {/* Search Input */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto" ref={yearViewRef}>
        <AnimatePresence mode="wait">
          {/* Year View - When grid icon is clicked */}
          {showYearView ? (
            <motion.div
              key="year-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <div className="space-y-6">
                {Array.from({ length: 12 }, (_, i) => i).map((monthIndex) => {
                  const monthDays = getMonthDays(monthIndex);
                  const monthName = dayjs(new Date(currentYear, monthIndex, 1)).format('MMMM');
                  const isCurrentMonth = today.month() === monthIndex && today.year() === currentYear;

                  return (
                    <div 
                      key={monthIndex} 
                      id={`month-${monthIndex}`}
                      className="bg-gray-900 rounded-xl overflow-hidden"
                    >
                      {/* Month Header */}
                      <div 
                        className={`px-4 py-3 text-center font-bold ${
                          isCurrentMonth ? 'bg-red-500 text-white' : 'bg-gray-800 text-red-500'
                        }`}
                      >
                        {monthName}
                      </div>

                      {/* Week Day Headers */}
                      <div className="grid grid-cols-7 border-b border-gray-800">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                          <div key={i} className="text-center text-xs font-semibold text-gray-500 py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Days */}
                      <div className="p-2">
                        {monthDays.map((week, weekIdx) => (
                          <div key={weekIdx} className="grid grid-cols-7 gap-1">
                            {week.map((day, dayIdx) => {
                              const isToday = day.format('YYYY-MM-DD') === today.format('YYYY-MM-DD');
                              const isCurrentMonthDay = day.month() === monthIndex;
                              const dayHasEvents = hasEvents(day);
                              const showTodayIndicator = isToday && isCurrentMonthDay;

                              return (
                                <motion.button
                                  key={dayIdx}
                                  whileTap={{ scale: isCurrentMonthDay ? 0.95 : 1 }}
                                  onClick={() => isCurrentMonthDay && handleDateClick(day)}
                                  className={`
                                    aspect-square flex flex-col items-center justify-center text-sm rounded-lg
                                    ${!isCurrentMonthDay ? 'text-gray-600' : 'text-white'}
                                    ${showTodayIndicator ? 'bg-red-500 font-bold' : ''}
                                    ${!showTodayIndicator && isCurrentMonthDay ? 'hover:bg-gray-800' : ''}
                                    ${!isCurrentMonthDay ? 'cursor-default' : 'cursor-pointer'}
                                  `}
                                >
                                  <span>{day.format('D')}</span>
                                  {dayHasEvents && isCurrentMonthDay && (
                                    <div className={`w-1 h-1 rounded-full mt-0.5 ${
                                      showTodayIndicator ? 'bg-white' : 'bg-red-500'
                                    }`} />
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : currentView === 'today' ? (
            /* Event List View - Today Tab */
            <motion.div
              key="event-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4"
            >
              {getGroupedEvents().length === 0 ? (
                <div className="text-center py-20">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500 text-lg">No events scheduled</p>
                  <p className="text-gray-600 text-sm mt-2">Tap + to create an event</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {getGroupedEvents().map((group, idx) => {
                    const isToday = group.date.format('YYYY-MM-DD') === today.format('YYYY-MM-DD');

                    return (
                      <div key={idx}>
                        {/* Date Header */}
                        <div className="mb-3">
                          <h2 className={`text-sm font-bold uppercase ${isToday ? 'text-white' : 'text-gray-400'}`}>
                            {group.date.format('dddd, D MMM')}
                          </h2>
                        </div>

                        {/* Events for this date */}
                        <div className="space-y-2">
                          {group.events.map((event) => (
                            <motion.div
                              key={event.eventId}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleEventClick(event)}
                              className="bg-gray-900 rounded-lg p-3 border-l-4 cursor-pointer"
                              style={{ borderLeftColor: labelColors[event.label] }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <div 
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: labelColors[event.label] }}
                                    />
                                    <h3 className="text-white font-medium">{event.event}</h3>
                                  </div>
                                  {event.location && (
                                    <p className="text-gray-500 text-xs mb-1">{event.location}</p>
                                  )}
                                </div>
                                <div className="text-right text-sm">
                                  <p className="text-white font-medium">
                                    {event.allDay ? 'all-day' : event.startTime}
                                  </p>
                                  {!event.allDay && (
                                    <p className="text-gray-500">{event.endTime}</p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : currentView === 'calendars' ? (
            /* Day View - Calendars Tab */
            <motion.div
              key="day-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-gray-900 m-4 rounded-xl overflow-hidden"
            >
              {/* Day Header */}
              <div className={`px-6 py-4 border-b border-gray-800 ${
                selectedDate.format('YYYY-MM-DD') === today.format('YYYY-MM-DD') 
                  ? 'bg-gradient-to-r from-orange-900 to-red-900' 
                  : 'bg-gray-800'
              }`}>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-400 uppercase">
                    {selectedDate.format('dddd')}
                  </p>
                  <p className="text-4xl font-bold text-white mt-2">
                    {selectedDate.format('D')}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedDate.format('MMMM YYYY')}
                  </p>
                </div>

                {/* All Day Events */}
                {getEventsForDate(selectedDate).filter(evt => evt.allDay).length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase">All Day</p>
                    {getEventsForDate(selectedDate).filter(evt => evt.allDay).map((evt, idx) => (
                      <motion.div
                        key={idx}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleEventClick(evt)}
                        className="px-4 py-3 rounded-xl cursor-pointer"
                        style={{ backgroundColor: labelColors[evt.label] }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{evt.event}</span>
                          {evt.location && (
                            <span className="text-xs text-white/90 flex items-center">
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
              <div className="relative">
                {timeSlots.map((time) => {
                  const hour = parseInt(time.split(':')[0]);
                  const isCurrentHour = selectedDate.format('YYYY-MM-DD') === today.format('YYYY-MM-DD') && hour === currentHour;

                  return (
                    <div
                      key={time}
                      className={`flex border-b border-gray-800 ${
                        isCurrentHour ? 'bg-red-900/20' : ''
                      }`}
                      style={{ height: '60px' }}
                    >
                      <div className="w-16 flex-shrink-0 px-2 py-2 text-right border-r border-gray-800">
                        <span className={`text-xs font-semibold ${
                          isCurrentHour ? 'text-red-500' : 'text-gray-500'
                        }`}>
                          {time}
                        </span>
                      </div>
                      <div className="flex-1 relative">
                        {isCurrentHour && (
                          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-500 z-10">
                            <div className="absolute left-0 w-2 h-2 bg-red-500 rounded-full -top-1"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Positioned Events */}
                <div className="absolute top-0 left-16 right-0 pointer-events-none">
                  {getEventsForDate(selectedDate)
                    .filter(evt => !evt.allDay)
                    .map((evt, idx) => {
                      const style = getEventStyle(evt);
                      if (!style) return null;

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleEventClick(evt)}
                          className="absolute left-2 right-2 rounded-lg p-3 shadow-lg cursor-pointer pointer-events-auto overflow-hidden"
                          style={{ ...style, backgroundColor: labelColors[evt.label] }}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <p className="font-bold text-sm leading-tight text-white">{evt.event}</p>
                            <Clock className="w-4 h-4 ml-2 flex-shrink-0 text-white" />
                          </div>
                          <p className="text-xs text-white/90 mb-1">
                            {evt.startTime} - {evt.endTime}
                          </p>
                          {evt.location && (
                            <p className="text-xs text-white/90 flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {evt.location}
                            </p>
                          )}
                          {evt.selectedGuest && evt.selectedGuest.length > 0 && (
                            <p className="text-xs text-white/90 flex items-center mt-1">
                              <Users className="w-3 h-3 mr-1" />
                              {evt.selectedGuest.length} guest{evt.selectedGuest.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          ) : (
            /* Inbox View */
            <motion.div
              key="inbox"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4"
            >
              <div className="text-center py-20">
                <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-500 text-lg">No notifications</p>
                <p className="text-gray-600 text-sm mt-2">Your inbox is empty</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-black border-t border-gray-800 px-4 py-2 flex items-center justify-around">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setCurrentView('today');
            setSelectedDate(dayjs());
            setShowYearView(false);
          }}
          className={`flex flex-col items-center py-2 ${
            currentView === 'today' ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          <Calendar className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Today</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentView('calendars')}
          className={`flex flex-col items-center py-2 ${
            currentView === 'calendars' ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          <Calendar className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Calendars</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentView('inbox')}
          className={`flex flex-col items-center py-2 ${
            currentView === 'inbox' ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          <Inbox className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Inbox</span>
        </motion.button>
      </div>
    </div>
  );
};

export default MobileCalendarView;