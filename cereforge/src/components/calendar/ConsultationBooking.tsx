import React, { useState, useEffect } from 'react';
import { X, Video, CheckCircle, User, Mail, Building, ChevronRight, ChevronLeft, Search, Globe, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';

interface ConsultationBookingProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'popup' | 'standalone';
}

const ConsultationBooking: React.FC<ConsultationBookingProps> = ({ isOpen, onClose, mode = 'popup' }) => {
  const [step, setStep] = useState(1);
  const [consultationType, setConsultationType] = useState<'discovery' | 'technical' | 'follow-up' | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    projectDescription: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('');
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(dayjs().month());

  // Auto-detect user's timezone on mount
  useEffect(() => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setSelectedTimezone(userTimezone);
  }, []);

  // Common timezones for quick access
  const commonTimezones = [
    { value: 'Africa/Lagos', label: 'West Africa Time (WAT)', offset: '+01:00' },
    { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
    { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00' },
    { value: 'Europe/London', label: 'British Time (GMT)', offset: '+00:00' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: '+01:00' },
    { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', offset: '+04:00' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', offset: '+05:30' },
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', offset: '+08:00' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: '+09:00' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', offset: '+10:00' },
  ];

  // Filter timezones based on search
  const filteredTimezones = commonTimezones.filter(tz =>
    tz.label.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
    tz.value.toLowerCase().includes(timezoneSearch.toLowerCase())
  );

  // Generate available dates with alternate day pattern (every other day)
  const getAvailableDates = (): Set<string> => {
    const availableDates = new Set<string>();
    let currentDate = dayjs().add(1, 'day');
    let count = 0;

    while (count < 30) {
      // Skip weekends
      if (currentDate.day() !== 0 && currentDate.day() !== 6) {
        // Alternate pattern: available, disabled, available, disabled...
        if (count % 2 === 0) {
          availableDates.add(currentDate.format('YYYY-MM-DD'));
        }
        count++;
      }
      currentDate = currentDate.add(1, 'day');
    }
    return availableDates;
  };

  const availableDates = getAvailableDates();

  // Check if a date is available
  const isDateAvailable = (date: Dayjs): boolean => {
    return availableDates.has(date.format('YYYY-MM-DD'));
  };

  // Generate time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'
  ];

  const consultationTypes = [
    {
      id: 'discovery' as const,
      title: 'Discovery Call',
      duration: '30 minutes',
      description: 'Initial project discussion and requirements gathering',
      icon: '🎯',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'technical' as const,
      title: 'Technical Review',
      duration: '60 minutes',
      description: 'Deep dive into technical architecture and implementation',
      icon: '⚙️',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'follow-up' as const,
      title: 'Follow-up Meeting',
      duration: '30 minutes',
      description: 'Progress review and next steps discussion',
      icon: '📊',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const handleSubmit = () => {
    console.log('Booking submitted:', {
      type: consultationType,
      date: selectedDate?.format('YYYY-MM-DD'),
      time: selectedTime,
      timezone: selectedTimezone,
      ...formData
    });
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setStep(1);
    setConsultationType(null);
    setSelectedDate(null);
    setSelectedTime('');
    setFormData({ name: '', email: '', company: '', projectDescription: '' });
    setIsSubmitted(false);
    setCurrentCalendarMonth(dayjs().month());
  };

  const handleConsultationTypeSelect = (type: 'discovery' | 'technical' | 'follow-up') => {
    setConsultationType(type);
    setStep(2);
  };

  // Generate calendar month for mini calendar
  const getMonthDays = (monthIndex: number): Dayjs[][] => {
    const year = dayjs().year();
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

  const handlePrevCalendarMonth = () => {
    setCurrentCalendarMonth(currentCalendarMonth - 1);
  };

  const handleNextCalendarMonth = () => {
    setCurrentCalendarMonth(currentCalendarMonth + 1);
  };

  // Get current timezone display
  const getCurrentTimezoneDisplay = () => {
    const tz = commonTimezones.find(t => t.value === selectedTimezone);
    if (tz) return `${tz.label} ${tz.offset}`;
    return selectedTimezone;
  };

  // Get selected consultation config
  const selectedConsultation = consultationType ? consultationTypes.find(t => t.id === consultationType) : null;

  if (!isOpen) return null;

  if (isSubmitted) {
    return (
      <div className={`${mode === 'popup' ? 'fixed inset-0 z-50' : ''} flex items-center justify-center p-4 ${mode === 'popup' ? 'bg-black/50 backdrop-blur-sm' : ''}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center relative"
        >
          {/* Powered by Cereforge Ribbon */}
          <div className="absolute -top-0 -right-0 overflow-hidden w-32 h-32 pointer-events-none">
            <div className="absolute top-6 right-[-50px] w-[200px] bg-gradient-to-r from-blue-900 to-blue-800 text-white text-xs font-bold py-2 text-center transform rotate-45 shadow-lg">
              Powered by CEREFORGE
            </div>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Consultation Booked!</h2>
          <p className="text-gray-600 mb-2">
            Your {selectedConsultation?.title.toLowerCase()} has been scheduled for:
          </p>
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="font-semibold text-blue-900">
              {selectedDate?.format('dddd, MMMM D, YYYY')}
            </p>
            <p className="text-blue-700">{selectedTime}</p>
            <p className="text-sm text-blue-600 mt-1">{getCurrentTimezoneDisplay()}</p>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            We've sent a confirmation email to <strong>{formData.email}</strong> with meeting details and calendar invite.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white font-semibold rounded-xl transition-all"
            >
              Done
            </button>
            <button
              onClick={resetForm}
              className="w-full px-6 py-3 text-blue-900 hover:bg-blue-50 font-semibold rounded-xl transition-all"
            >
              Book Another Consultation
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`${mode === 'popup' ? 'fixed inset-0 z-50' : ''} flex items-center justify-center p-4 ${mode === 'popup' ? 'bg-black/50 backdrop-blur-sm' : ''} overflow-y-auto`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white rounded-2xl shadow-2xl ${consultationType ? 'max-w-5xl' : 'max-w-3xl'} w-full  my-8 relative overflow-hidden`}
      >
        {/* Close Button - Positioned above the ribbon */}
        {mode === 'popup' && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="absolute top-1 right-1 z-20 p-2 hover:bg-blue-600 rounded-lg transition-colors bg-blue-800 shadow-md"
          >
            <X className="w-5 h-5 text-red-600" />
          </motion.button>
        )}

        {/* Powered by Cereforge Ribbon */}
        <div className="absolute -top-0 -right-0 overflow-hidden w-32 h-32 pointer-events-none z-10">
          <div className="absolute top-6 right-[-50px] w-[200px] bg-gradient-to-r from-blue-900 to-blue-800 text-white text-xs font-bold py-2 text-center transform rotate-45 shadow-lg">
            Powered by CEREFORGE
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Left Summary Panel - Only show after consultation type is selected */}
          {consultationType && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="md:w-80 bg-gradient-to-br from-blue-900 to-blue-800 text-white p-6 flex flex-col"
            >
              {/* Back button - Only visible in step 2 (Desktop) */}
              {step === 2 && (
                <motion.button
                  whileHover={{ x: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setConsultationType(null);
                    setStep(1);
                    setSelectedDate(null);
                    setSelectedTime('');
                  }}
                  className="hidden md:flex items-center space-x-2 text-orange-600 hover:text-orange-500 transition-colors mb-6 -ml-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">Change Consultation Type</span>
                </motion.button>
              )}

              {/* Back button for mobile - visible in all steps after step 1 */}
              <button
                onClick={() => {
                  if (step === 2) {
                    setConsultationType(null);
                    setStep(1);
                    setSelectedDate(null);
                    setSelectedTime('');
                  } else {
                    setStep(step - 1);
                  }
                }}
                className="md:hidden mb-4 flex items-center text-white hover:text-orange-500 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                <span className="text-sm font-medium">Back</span>
              </button>

              {/* Consultation Type Summary */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${selectedConsultation?.color} rounded-xl flex items-center justify-center text-2xl`}>
                    {selectedConsultation?.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedConsultation?.title}</h3>
                    <p className="text-blue-200 text-sm">{selectedConsultation?.duration}</p>
                  </div>
                </div>
                <p className="text-blue-100 text-sm">{selectedConsultation?.description}</p>
              </div>

              <div className="space-y-4 flex-1">
                {/* Date & Time */}
                {selectedDate && selectedTime && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <CalendarIcon className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm mb-1">{selectedDate.format('dddd, MMMM D, YYYY')}</p>
                        <p className="text-blue-200 text-sm">{selectedTime}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timezone */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Globe className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-blue-200 text-xs mb-1">Time Zone</p>
                      <p className="font-medium text-sm break-words">{getCurrentTimezoneDisplay()}</p>
                    </div>
                  </div>
                </div>

                {/* Meeting Details */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Video className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-200 text-xs mb-1">Meeting Format</p>
                      <p className="font-medium text-sm">Web Conferencing</p>
                      <p className="text-blue-200 text-xs mt-1">Details provided upon confirmation</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Right Content Panel */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {step === 1 && 'Select Consultation Type'}
                  {step === 2 && 'Select Date & Time'}
                  {step === 3 && 'Enter Your Details'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {step === 1 && 'Choose the type of consultation you need'}
                  {step === 2 && 'Pick a date and time that works for you'}
                  {step === 3 && 'We need some information to complete your booking'}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: mode === 'popup' ? 'calc(90vh - 180px)' : '600px' }}>
              <AnimatePresence mode="wait">
                {/* Step 1: Consultation Type */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {consultationTypes.map((type) => (
                      <motion.div
                        key={type.id}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleConsultationTypeSelect(type.id)}
                        className="p-6 rounded-xl border-2 border-gray-200 hover:border-blue-900 cursor-pointer transition-all group"
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`w-14 h-14 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                            {type.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-lg font-bold text-gray-900">{type.title}</h4>
                              <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{type.duration}</span>
                            </div>
                            <p className="text-gray-600">{type.description}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-900 transition-colors flex-shrink-0" />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Step 2: Date & Time Selection */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex h-full"
                  >
                    {/* Left: Calendar and Timezone */}
                    <div className="flex-1 space-y-4 pr-4">
                      {/* Compact Timezone Selector */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center">
                          <Globe className="w-3 h-3 inline mr-1" />
                          Time Zone
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-left hover:border-blue-900 transition-all flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-700 truncate">{getCurrentTimezoneDisplay()}</span>
                            <ChevronRight className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ml-2 ${showTimezoneDropdown ? 'rotate-90' : ''}`} />
                          </button>

                          {showTimezoneDropdown && (
                            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
                              <div className="p-2 border-b border-gray-200">
                                <div className="relative">
                                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                  <input
                                    type="text"
                                    value={timezoneSearch}
                                    onChange={(e) => setTimezoneSearch(e.target.value)}
                                    placeholder="Search timezone..."
                                    className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <div className="overflow-y-auto max-h-48">
                                {filteredTimezones.map((tz) => (
                                  <button
                                    key={tz.value}
                                    type="button"
                                    onClick={() => {
                                      setSelectedTimezone(tz.value);
                                      setShowTimezoneDropdown(false);
                                      setTimezoneSearch('');
                                    }}
                                    className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors text-xs ${
                                      selectedTimezone === tz.value ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="truncate">{tz.label}</span>
                                      <span className="text-gray-500 ml-2 flex-shrink-0">{tz.offset}</span>
                                    </div>
                                  </button>
                                ))}
                                {filteredTimezones.length === 0 && (
                                  <div className="px-3 py-6 text-center text-gray-500 text-xs">
                                    No timezones found matching "{timezoneSearch}"
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Full Month Calendar View */}
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-4">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePrevCalendarMonth}
                            disabled={currentCalendarMonth <= dayjs().month()}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                          </motion.button>
                          
                          <h3 className="text-lg font-bold text-gray-900">
                            {dayjs(new Date(dayjs().year(), currentCalendarMonth)).format('MMMM YYYY')}
                          </h3>
                          
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNextCalendarMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                          </motion.button>
                        </div>

                        {/* Days of Week */}
                        <div className="grid grid-cols-7 gap-2 mb-3">
                          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, i) => (
                            <div key={i} className="text-center text-xs font-semibold text-gray-500 py-2">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-2">
                          {getMonthDays(currentCalendarMonth).flat().map((day, idx) => {
                            const isCurrentMonth = day.month() === currentCalendarMonth;
                            const isAvailable = isDateAvailable(day) && isCurrentMonth;
                            const isSelected = selectedDate?.format('YYYY-MM-DD') === day.format('YYYY-MM-DD');
                            const isToday = day.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

                            return (
                              <motion.button
                                key={idx}
                                type="button"
                                whileHover={isAvailable ? { scale: 1.05 } : {}}
                                whileTap={isAvailable ? { scale: 0.95 } : {}}
                                onClick={() => isAvailable && setSelectedDate(day)}
                                disabled={!isAvailable}
                                className={`
                                  aspect-square flex items-center justify-center text-sm rounded-lg transition-all font-medium
                                  ${!isCurrentMonth ? 'text-gray-300 cursor-not-allowed invisible' : ''}
                                  ${isAvailable && !isSelected ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer' : ''}
                                  ${!isAvailable && isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : ''}
                                  ${isSelected ? 'bg-blue-600 text-white font-bold shadow-md' : ''}
                                  ${isToday && !isSelected && isAvailable ? 'ring-2 ring-blue-600 ring-inset' : ''}
                                `}
                              >
                                {day.format('D')}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right: Time Slots (only visible when date is selected) */}
                    {selectedDate && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-64 border-l border-gray-200 pl-4"
                      >
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            {selectedDate.format('dddd, MMMM D')}
                          </h4>
                          <p className="text-xs text-gray-500">{getCurrentTimezoneDisplay()}</p>
                        </div>

                        {/* Scrollable Time Slots */}
                        <div className="space-y-2 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                          {timeSlots.map((time) => {
                            const isSelected = selectedTime === time;
                            return (
                              <motion.button
                                key={time}
                                type="button"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                  setSelectedTime(time);
                                  setStep(3);
                                }}
                                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all text-center ${
                                  isSelected
                                    ? 'bg-blue-900 text-white'
                                    : 'bg-white border-2 border-gray-200 hover:border-blue-900 text-gray-700 hover:bg-blue-50'
                                }`}
                              >
                                {time}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Contact Details */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-lg font-medium"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-lg font-medium"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Building className="w-4 h-4 inline mr-1" />
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-lg font-medium"
                        placeholder="Your company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        What would you like to discuss?
                      </label>
                      <textarea
                        value={formData.projectDescription}
                        onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                        placeholder="Brief description of your project or what you'd like to discuss"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              {consultationType && step > 2 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center space-x-2 px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
              ) : (
                <div></div>
              )}

              {step === 3 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.email}
                  className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Confirm Booking</span>
                </motion.button>
              ) : (
                <div></div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ConsultationBooking;