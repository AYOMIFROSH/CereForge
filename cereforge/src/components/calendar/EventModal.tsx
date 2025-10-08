import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, FileText, Users, Bell, Trash2, Save, Repeat, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  daySelected: Dayjs;
  selectedEvent?: any | null;
  onSave: (event: any) => void;
  onDelete?: (eventId: string) => void;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  daySelected,
  selectedEvent,
  onSave,
  onDelete
}) => {
  const [event, setEvent] = useState(selectedEvent?.event || '');
  const [description, setDescription] = useState(selectedEvent?.description || '');
  const [location, setLocation] = useState(selectedEvent?.location || '');
  const [allDay, setAllDay] = useState(selectedEvent?.allDay ?? true);
  const [startTime, setStartTime] = useState(selectedEvent?.startTime || '09:00');
  const [endTime, setEndTime] = useState(selectedEvent?.endTime || '10:00');
  const [selectedLabel, setSelectedLabel] = useState(selectedEvent?.label || 'blue');
  const [recurrence, setRecurrence] = useState(selectedEvent?.recurrence || 'none');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [timezone, _setTimezone] = useState(selectedEvent?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Guest management
  const [guests, setGuests] = useState<string[]>(selectedEvent?.selectedGuest?.map((g: any) => g.email) || []);
  const [guestInput, setGuestInput] = useState('');
  
  // Notification settings
  const [notificationType, setNotificationType] = useState(selectedEvent?.notification?.type || 'Snooze');
  const [notificationInterval, setNotificationInterval] = useState(selectedEvent?.notification?.interval || 15);

  const labels = ['indigo', 'grey', 'green', 'blue', 'red', 'purple'];
  
  const labelColors: Record<string, string> = {
    indigo: 'bg-indigo-500',
    grey: 'bg-gray-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  const recurrenceOptions = [
    { value: 'none', label: 'Does not repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'annually', label: 'Annually' }
  ];

  const handleAddGuest = () => {
    if (guestInput && guestInput.includes('@')) {
      setGuests([...guests, guestInput]);
      setGuestInput('');
    }
  };

  const handleRemoveGuest = (email: string) => {
    setGuests(guests.filter(g => g !== email));
  };

  const calculateDuration = () => {
    if (allDay) return 'All day';
    const start = dayjs(`2000-01-01 ${startTime}`);
    const end = dayjs(`2000-01-01 ${endTime}`);
    const diff = end.diff(start, 'minute');
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${minutes} minutes`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event.trim()) return;

    const eventData = {
      eventId: selectedEvent?.eventId || `event_${Date.now()}`,
      event,
      description,
      location,
      day: daySelected.valueOf(),
      allDay,
      startTime: allDay ? '12:00 AM' : startTime,
      endTime: allDay ? '11:59 PM' : endTime,
      label: selectedLabel,
      timezone,
      recurrence,
      selectedGuest: guests.map(email => ({ email, name: email.split('@')[0] })),
      userId: null,
      notification: {
        type: notificationType,
        interval: notificationType === 'Snooze' ? null : notificationInterval,
        timeUnit: notificationType === 'Snooze' ? null : 'Minute'
      }
    };

    onSave(eventData);
    onClose();
  };

  const handleDelete = () => {
    if (selectedEvent && onDelete) {
      onDelete(selectedEvent.eventId);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedEvent ? 'Edit Event' : 'Create Event'}
                </h2>
                <p className="text-blue-200 text-sm">
                  {daySelected.format('MMMM D, YYYY')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {selectedEvent && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  title="Delete Event"
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
            <div className="p-6 space-y-6">
              {/* Event Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-lg font-medium"
                  placeholder="Add event title"
                  required
                  autoFocus
                />
              </div>

              {/* All Day Toggle & Duration Display */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="allDay" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    All Day Event
                  </label>
                </div>
                {!allDay && (
                  <span className="text-sm font-semibold text-blue-600">
                    Duration: {calculateDuration()}
                  </span>
                )}
              </div>

              {/* Time Selection */}
              {!allDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Timezone */}
              {!allDay && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Timezone
                  </label>
                  <div className="px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-sm text-blue-800 font-medium">
                    {timezone}
                  </div>
                </div>
              )}

              {/* Recurrence */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Repeat className="w-4 h-4 inline mr-1" />
                  Repeat
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                >
                  {recurrenceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder="Add location"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
                  placeholder="Add description"
                />
              </div>

              {/* Guests */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Guests
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="email"
                    value={guestInput}
                    onChange={(e) => setGuestInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGuest())}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    placeholder="Add guest email"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddGuest}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
                  >
                    Add
                  </motion.button>
                </div>
                {guests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {guests.map((guest, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <span className="text-sm text-blue-800">{guest}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGuest(guest)}
                          className="text-blue-600 hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Bell className="w-4 h-4 inline mr-1" />
                  Notification
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  >
                    <option value="Snooze">Snooze</option>
                    <option value="Email">Email</option>
                    <option value="Number">SMS</option>
                  </select>
                  {notificationType !== 'Snooze' && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={notificationInterval}
                        onChange={(e) => setNotificationInterval(Number(e.target.value))}
                        min="1"
                        className="w-20 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                      <span className="text-sm text-gray-600">minutes before</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Label Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Event Label
                </label>
                <div className="flex flex-wrap gap-3">
                  {labels.map((label) => (
                    <motion.button
                      key={label}
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedLabel(label)}
                      className={`
                        w-12 h-12 rounded-xl ${labelColors[label]} 
                        flex items-center justify-center transition-all
                        ${selectedLabel === label ? 'ring-4 ring-offset-2 ring-blue-500' : 'opacity-60 hover:opacity-100'}
                      `}
                    >
                      {selectedLabel === label && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between sticky bottom-0">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 font-semibold hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg transition-all"
              >
                <Save className="w-5 h-5" />
                <span>{selectedEvent ? 'Update Event' : 'Create Event'}</span>
              </motion.button>
            </div>
          </form>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-20"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Event?</h3>
                    <p className="text-gray-600">
                      Are you sure you want to delete "{event}"? This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EventModal;