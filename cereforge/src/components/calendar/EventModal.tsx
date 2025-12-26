// src/components/calendar/EventModal.tsx
import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, FileText, Users, Bell, Trash2, Save, Repeat, Globe, Mail, Send, AlertTriangle} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';
import CustomRecurrenceModal from './CustomRecurrenceModal';
import { ConfirmationModal } from './modals/ModalsUtils';
import type {
  CalendarEvent,
  RecurrenceType,
  RecurrenceConfig,
  EventLabel,
  Guest
} from '@/types/calendar.types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  daySelected: Dayjs;
  selectedEvent?: CalendarEvent | null;
  onSave: (event: CalendarEvent) => void;
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
  // =========================================================================
  // 🧠 LOGIC SECTION (EXACTLY AS PROVIDED)
  // =========================================================================
  
  // ✅ Basic event fields
  const [event, setEvent] = useState(selectedEvent?.event || selectedEvent?.title || '');
  const [description, setDescription] = useState(selectedEvent?.description || '');
  const [location, setLocation] = useState(selectedEvent?.location || '');
  const [allDay, setAllDay] = useState(selectedEvent?.allDay ?? true);
  const [startTime, setStartTime] = useState(selectedEvent?.startTime || '09:00');
  const [endTime, setEndTime] = useState(selectedEvent?.endTime || '10:00');
  const [selectedLabel, setSelectedLabel] = useState<EventLabel>(selectedEvent?.label || 'blue');

  const [showRecurringUpdateModal, setShowRecurringUpdateModal] = useState(false);
  const [pendingUpdateData, setPendingUpdateData] = useState<CalendarEvent | null>(null);

  // ✅ Recurrence state
  const [recurrence, setRecurrence] = useState<RecurrenceType | RecurrenceConfig>(() => {
    if (!selectedEvent?.recurrence) return 'none';
    if (typeof selectedEvent.recurrence === 'string') return selectedEvent.recurrence;
    if (typeof selectedEvent.recurrence === 'object' && selectedEvent.recurrence.type) {
      if (selectedEvent.recurrence.type === 'custom' && selectedEvent.recurrence.config) {
        return selectedEvent.recurrence as RecurrenceConfig;
      }
      return selectedEvent.recurrence.type as RecurrenceType;
    }
    return 'none';
  });

  const [timezone] = useState(selectedEvent?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);

  // ✅ Guest management
  const [guests, setGuests] = useState<Guest[]>(selectedEvent?.selectedGuest || selectedEvent?.guests || []);

  // ✅ Notifications
  const [notificationType, setNotificationType] = useState(selectedEvent?.notification?.type || 'Snooze');
  const [notificationInterval, setNotificationInterval] = useState(selectedEvent?.notification?.interval || 15);

  // ✅ UI state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCustomRecurrence, setShowCustomRecurrence] = useState(false);
  const [showGuestConfirm, setShowGuestConfirm] = useState(false);
  const [guestInput, setGuestInput] = useState('');

  const labels: EventLabel[] = ['indigo', 'grey', 'green', 'blue', 'red', 'purple'];

  const labelColors: Record<EventLabel, string> = {
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
    { value: 'annually', label: 'Annually' },
    { value: 'weekdays', label: 'Every weekday (Mon-Fri)' },
    { value: 'custom', label: 'Custom...' }
  ];

  // ✅ Guest management functions
  const handleAddGuest = () => {
    if (guestInput && guestInput.includes('@')) {
      const newGuest: Guest = {
        email: guestInput,
        name: guestInput.split('@')[0]
      };
      setGuests([...guests, newGuest]);
      setGuestInput('');
    }
  };

  const handleRemoveGuest = (email: string) => {
    setGuests(guests.filter(g => g.email !== email));
  };

  // ✅ FIX: This function is now used in the render method below
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

  const handleRecurrenceChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomRecurrence(true);
    } else {
      setRecurrence(value as RecurrenceType);
    }
  };
  
  const handleCustomRecurrenceSave = (customRecurrence: RecurrenceConfig) => {
    console.log('📥 EventModal: Received custom recurrence:', customRecurrence);
    setRecurrence(customRecurrence);
    setTimeout(() => {
      console.log('✅ State after setRecurrence:', recurrence);
    }, 100);
  };

  // ✅ Save with guest confirmation
  const handleSubmit = () => {
    if (!event.trim()) return;

    const isRecurringInstance = selectedEvent && (
      selectedEvent.isInstance ||
      selectedEvent.parentEventId ||
      (selectedEvent.recurrenceType && selectedEvent.recurrenceType !== 'none') ||
      (selectedEvent.isRecurringParent)
    );

    if (isRecurringInstance) {
      const eventData: CalendarEvent = {
        id: selectedEvent?.id || selectedEvent?.eventId || `event_${Date.now()}`,
        eventId: selectedEvent?.eventId || `event_${Date.now()}`,
        title: event,
        event: event,
        description,
        location,
        day: daySelected.valueOf(),
        allDay,
        startTime: allDay ? '00:00' : startTime,
        endTime: allDay ? '23:59' : endTime,
        label: selectedLabel,
        timezone,
        recurrence: recurrence,
        guests: guests,
        selectedGuest: guests,
        userId: selectedEvent?.userId,
        notification: {
          type: notificationType,
          interval: notificationType === 'Snooze' ? null : notificationInterval,
          timeUnit: notificationType === 'Snooze' ? null : 'Minute'
        },
        notificationSettings: {
          type: notificationType,
          interval: notificationType === 'Snooze' ? null : notificationInterval,
          timeUnit: notificationType === 'Snooze' ? null : 'Minute'
        }
      };

      setPendingUpdateData(eventData);
      setShowRecurringUpdateModal(true);
      return; 
    }

    if (guests.length > 0 && !selectedEvent) {
      setShowGuestConfirm(true);
      return;
    }

    saveEvent(false);
  };

  const saveEvent = (sendInvites: boolean) => {
    const eventData: CalendarEvent = {
      id: selectedEvent?.id || selectedEvent?.eventId || `event_${Date.now()}`,
      eventId: selectedEvent?.eventId || `event_${Date.now()}`,
      title: event,
      event: event,
      description,
      location,
      day: daySelected.valueOf(),
      allDay,
      startTime: allDay ? '00:00' : startTime,
      endTime: allDay ? '23:59' : endTime,
      label: selectedLabel,
      timezone,
      recurrence: recurrence,
      guests: guests,
      selectedGuest: guests,
      userId: selectedEvent?.userId,
      notification: {
        type: notificationType,
        interval: notificationType === 'Snooze' ? null : notificationInterval,
        timeUnit: notificationType === 'Snooze' ? null : 'Minute'
      },
      notificationSettings: {
        type: notificationType,
        interval: notificationType === 'Snooze' ? null : notificationInterval,
        timeUnit: notificationType === 'Snooze' ? null : 'Minute'
      }
    };

    (eventData as any).sendInvitations = sendInvites;
    console.log('💾 EventModal: Final event data being saved:', eventData);
    onSave(eventData);
    setShowGuestConfirm(false);
    onClose();
  };

  const handleDelete = () => {
    if (selectedEvent && onDelete) {
      onDelete(selectedEvent.id || selectedEvent.eventId!);
      onClose();
    }
  };

  if (!isOpen) return null;

  // =========================================================================
  // 🎨 UI SECTION (MODERNIZED & COMPACT)
  // =========================================================================

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header - CLEAN WHITE */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedEvent ? 'Edit Event' : 'New Event'}
              </h2>
              <div className="flex items-center text-sm text-gray-500 mt-0.5">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                {daySelected.format('dddd, MMMM D, YYYY')}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedEvent && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Event"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body - SCROLLABLE */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Title Input - Large & Borderless */}
            <div>
              <input
                type="text"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                className="w-full text-2xl font-semibold text-gray-900 placeholder-gray-300 border-none focus:ring-0 p-0 focus:outline-none"
                placeholder="Add title"
                autoFocus
              />
              <div className="h-px bg-gray-100 mt-4 w-full" />
            </div>

            {/* Main Details Grid */}
            <div className="space-y-5">
              
              {/* Time & All Day */}
              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center flex-wrap gap-4">
                     <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allDay}
                        onChange={(e) => setAllDay(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">All Day</span>
                    </label>

                    {!allDay && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        {/* ✅ FIX: Added Duration Display Here */}
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md whitespace-nowrap">
                          {calculateDuration()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {!allDay && (
                     <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Globe className="w-3.5 h-3.5" />
                        <span>{timezone}</span>
                     </div>
                  )}
                </div>
              </div>

              {/* Recurrence */}
              <div className="flex items-start gap-4">
                <Repeat className="w-5 h-5 text-gray-400 shrink-0 mt-2" />
                <div className="flex-1">
                  {typeof recurrence === 'object' && recurrence.type === 'custom' ? (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-sm text-blue-900 font-medium leading-relaxed">
                        Every {recurrence.config.interval} {recurrence.config.repeatUnit}
                        {recurrence.config.repeatUnit === 'week' && recurrence.config.daysOfWeek.length > 0 && (
                          <> on {recurrence.config.daysOfWeek.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}</>
                        )}
                        {recurrence.config.endType === 'after' && <>, {recurrence.config.occurrences} times</>}
                        {recurrence.config.endType === 'on' && <>, until {dayjs(recurrence.config.endDate).format('MMM D, YYYY')}</>}
                      </p>
                      <div className="flex gap-3 mt-2">
                        <button onClick={() => setShowCustomRecurrence(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline">Edit</button>
                        <button onClick={() => setRecurrence('none')} className="text-xs font-semibold text-gray-500 hover:text-gray-700 underline">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={typeof recurrence === 'string' ? recurrence : 'custom'}
                      onChange={(e) => handleRecurrenceChange(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      {recurrenceOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full" />

              {/* Location */}
              <div className="flex items-center gap-4">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400"
                  placeholder="Add location"
                />
              </div>

              {/* Guests */}
              <div className="flex items-start gap-4">
                <Users className="w-5 h-5 text-gray-400 shrink-0 mt-2.5" />
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={guestInput}
                      onChange={(e) => setGuestInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGuest())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400"
                      placeholder="Add guest email"
                    />
                    <button
                      type="button"
                      onClick={handleAddGuest}
                      disabled={!guestInput}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                  {guests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {guests.map((guest, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md border border-gray-200">
                          <Mail className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-700">{guest.email}</span>
                          <button onClick={() => handleRemoveGuest(guest.email)} className="text-gray-400 hover:text-red-500 ml-1">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notification */}
              <div className="flex items-center gap-4">
                <Bell className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value as any)}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="Snooze">Notification</option>
                    <option value="Email">Email</option>
                    <option value="Number">SMS</option>
                  </select>
                  
                  {notificationType !== 'Snooze' && (
                    <>
                      <input
                        type="number"
                        value={notificationInterval}
                        onChange={(e) => setNotificationInterval(Number(e.target.value))}
                        min="1"
                        className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center outline-none focus:border-blue-500"
                      />
                      <span className="text-sm text-gray-600">min before</span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="flex items-start gap-4">
                <FileText className="w-5 h-5 text-gray-400 shrink-0 mt-2" />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-400"
                  placeholder="Add description"
                />
              </div>

              {/* Label Colors */}
              <div className="flex items-center gap-4 pt-1">
                 <div className="w-5 h-5" /> {/* Spacer for icon alignment */}
                 <div className="flex gap-2">
                  {labels.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSelectedLabel(label)}
                      className={`w-5 h-5 rounded-full transition-transform ${labelColors[label]} ${
                        selectedLabel === label ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={label}
                    />
                  ))}
                 </div>
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
             <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!event.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{selectedEvent ? 'Update Event' : 'Create Event'}</span>
              </motion.button>
          </div>

          {/* --- MODALS SECTION (LOGIC UNTOUCHED) --- */}

          {/* Guest Confirmation Modal */}
          <AnimatePresence>
            {showGuestConfirm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-20">
                <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
                   <div className="text-center mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                         <Send className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Send invitations?</h3>
                      <p className="text-sm text-gray-600 mt-1">You've added guests. Send them emails?</p>
                   </div>
                   <div className="space-y-2">
                      <button onClick={() => saveEvent(true)} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">Send Emails</button>
                      <button onClick={() => saveEvent(false)} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">Don't Send</button>
                      <button onClick={() => setShowGuestConfirm(false)} className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-20">
                <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Event?</h3>
                  <p className="text-sm text-gray-600 mb-6">Are you sure? This cannot be undone.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
                    <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>

      {/* External Modals */}
      <CustomRecurrenceModal
        isOpen={showCustomRecurrence}
        onClose={() => setShowCustomRecurrence(false)}
        onSave={handleCustomRecurrenceSave}
        initialRecurrence={typeof recurrence === 'object' && recurrence.type === 'custom' ? recurrence : null}
        eventStartDate={daySelected}
      />

      <ConfirmationModal
        isOpen={showRecurringUpdateModal}
        onClose={() => { setShowRecurringUpdateModal(false); setPendingUpdateData(null); }}
        onConfirm={() => { if (pendingUpdateData) { onSave(pendingUpdateData); setPendingUpdateData(null); onClose(); } }}
        title="Update Recurring Series"
        message="This will update this and all future events in the series."
        icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
        iconBgColor="bg-amber-100"
        confirmText="Update Series"
        confirmColor="bg-blue-600 hover:bg-blue-700"
        cancelText="Cancel"
      />
    </AnimatePresence>
  );
};

export default EventModal;