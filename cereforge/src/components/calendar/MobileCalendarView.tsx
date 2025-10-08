import React, { useState } from 'react';
import { Plus, Filter, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

const MobileCalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [showMenu, setShowMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const events = [
    { id: 1, title: 'Team Meeting', time: '09:00', color: 'blue', date: dayjs() },
    { id: 2, title: 'Project Review', time: '14:00', color: 'green', date: dayjs() },
    { id: 3, title: 'Client Call', time: '16:00', color: 'orange', date: dayjs().add(1, 'day') },
  ];

  const getDaysInMonth = () => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startDay = startOfMonth.day();
    const daysInMonth = endOfMonth.date();
    
    const days = [];
    // Previous month days
    for (let i = 0; i < startDay; i++) {
      days.push({ date: startOfMonth.subtract(startDay - i, 'day'), isCurrentMonth: false });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: startOfMonth.add(i - 1, 'day'), isCurrentMonth: true });
    }
    // Next month days to fill grid
    const remainingDays = 35 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: endOfMonth.add(i, 'day'), isCurrentMonth: false });
    }
    
    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Mobile Header */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-900 px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-lg transform -skew-x-12"></div>
              <span className="text-blue-900 relative z-10 px-2 py-1 font-bold text-sm">CERE</span>
            </div>
            <span className="text-white font-bold text-sm">FORGE</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 bg-white/20 rounded-lg text-white"
            >
              <Filter className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 bg-white/20 rounded-lg text-white"
            >
              {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentDate(currentDate.subtract(1, 'month'))}
            className="p-2 bg-white/20 rounded-lg text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">
              {currentDate.format('MMMM YYYY')}
            </h2>
            <p className="text-blue-200 text-sm">
              {events.length} events this month
            </p>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentDate(currentDate.add(1, 'month'))}
            className="p-2 bg-white/20 rounded-lg text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* View Switcher */}
        <div className="flex space-x-2 mt-4">
          {['month', 'week', 'day'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v as any)}
              className={`
                flex-1 py-2 rounded-lg font-semibold text-sm capitalize transition-all
                ${view === v 
                  ? 'bg-white text-blue-800' 
                  : 'bg-white/20 text-white'
                }
              `}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 right-4 left-4 bg-white rounded-2xl shadow-2xl border border-gray-200 z-40 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              <button className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg font-medium text-gray-700 transition-colors">
                📹 Book Consultation
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg font-medium text-gray-700 transition-colors">
                ⚙️ Settings
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg font-medium text-gray-700 transition-colors">
                🔔 Notifications
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg font-medium text-gray-700 transition-colors">
                🏠 Back to Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Dropdown */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 right-4 left-4 bg-white rounded-2xl shadow-2xl border border-gray-200 z-40 overflow-hidden"
          >
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-3">Filter Labels</h3>
              <div className="space-y-2">
                {['indigo', 'grey', 'green', 'blue', 'red', 'purple'].map((color) => (
                  <label key={color} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                    <span className="capitalize text-gray-700">{color}</span>
                    <div className={`ml-auto w-4 h-4 rounded-full bg-${color}-500`}></div>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Month View */}
      {view === 'month' && (
        <div className="p-4">
          {/* Week Days */}
          <div className="grid grid-cols-7 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-xs font-semibold text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((day, idx) => {
              const isToday = day.date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
              const hasEvents = events.some(e => e.date.format('YYYY-MM-DD') === day.date.format('YYYY-MM-DD'));
              
              return (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all
                    ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                    ${isToday ? 'bg-orange-500 text-white font-bold' : 'bg-white hover:bg-blue-50'}
                  `}
                >
                  <span>{day.date.format('D')}</span>
                  {hasEvents && (
                    <div className={`w-1 h-1 rounded-full mt-1 ${isToday ? 'bg-white' : 'bg-blue-500'}`}></div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Today's Events */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Events</h3>
            <div className="space-y-3">
              {events.filter(e => e.date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')).map((event) => (
                <motion.div
                  key={event.id}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl bg-${event.color}-50 border-l-4 border-${event.color}-500`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-600">{event.time}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-full bg-${event.color}-500 flex items-center justify-center text-white font-bold`}>
                      {event.time.split(':')[0]}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="p-4">
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => {
              const day = dayjs().startOf('week').add(i, 'day');
              const isToday = day.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
              
              return (
                <div key={i} className={`p-4 rounded-xl ${isToday ? 'bg-orange-50 border-2 border-orange-500' : 'bg-white border border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-500">{day.format('ddd')}</p>
                      <p className={`text-2xl font-bold ${isToday ? 'text-orange-600' : 'text-gray-900'}`}>
                        {day.format('D')}
                      </p>
                    </div>
                    {isToday && (
                      <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">2 events</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {view === 'day' && (
        <div className="p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white text-center">
              <p className="text-sm font-semibold opacity-90">{currentDate.format('dddd')}</p>
              <p className="text-5xl font-bold my-2">{currentDate.format('D')}</p>
              <p className="text-sm opacity-90">{currentDate.format('MMMM YYYY')}</p>
            </div>
            
            <div className="p-4 space-y-3">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className={`w-12 h-12 rounded-xl bg-${event.color}-500 flex items-center justify-center text-white font-bold`}>
                    {event.time.split(':')[0]}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-600">{event.time}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Create Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full shadow-2xl flex items-center justify-center text-white z-30"
      >
        <Plus className="w-8 h-8" />
      </motion.button>
    </div>
  );
};

export default MobileCalendarView;