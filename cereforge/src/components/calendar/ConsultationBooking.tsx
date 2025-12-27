import React, { useState, useEffect } from 'react';
import { X, Video, CheckCircle, ChevronRight, ChevronLeft, Globe, Clock, Zap, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';
import { SYSTEM_BOOKING_CONSULTATIONS } from '@/utils/ConsultationConstants';
import { filterTimezones, getTimezoneDisplay, getUserTimezone } from '@/utils/TimezoneUtils';

interface VariantConfig {
  id: string;
  title: string;
  duration: string;
  description: string;
  isActive: boolean;
  icon?: string;
  color?: string;
}

interface DynamicConfig {
  consultationType: string;
  companyName: string;
  duration: string;
  description: string;
  availableDays: string[];
  availableTimes: { [key: string]: { openTime: string; closeTime: string } };
  bufferHours: number;
  isActive: boolean;
  isSystemBooking?: boolean;
  variants?: VariantConfig[];
}

interface ConsultationBookingProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'popup' | 'standalone';
  config?: DynamicConfig;
}

const ConsultationBooking: React.FC<ConsultationBookingProps> = ({ 
  isOpen, 
  onClose, 
  mode = 'popup',
  config 
}) => {
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

  useEffect(() => {
    const userTimezone = getUserTimezone();
    setSelectedTimezone(userTimezone);
  }, []);

  useEffect(() => {
    if (config) {
      if (config.isSystemBooking) {
        setStep(1);
      } else {
        setConsultationType('discovery');
        setStep(2);
      }
    }
  }, [config]);

  const isBookingPaused = config && !config.isActive;

  const getActiveVariants = () => {
    if (!config?.isSystemBooking || !config.variants) {
      return SYSTEM_BOOKING_CONSULTATIONS;
    }
    return config.variants.filter(v => v.isActive);
  };

  const activeVariants = getActiveVariants();
  const allVariantsPaused = config?.isSystemBooking && activeVariants.length === 0;

  const filteredTimezones = filterTimezones(timezoneSearch);

  const getAvailableDates = (): Set<string> => {
    const availableDates = new Set<string>();
    let currentDate = dayjs().add(1, 'day');
    let count = 0;
    const bufferHours = config?.bufferHours || 48;
    
    while (count < 30) {
      if (config?.availableDays) {
        const dayName = currentDate.format('dddd').toLowerCase();
        if (config.availableDays.includes(dayName)) {
          if (count % Math.ceil(bufferHours / 24) === 0) {
            availableDates.add(currentDate.format('YYYY-MM-DD'));
          }
          count++;
        }
      } else {
        if (currentDate.day() !== 0 && currentDate.day() !== 6) {
          if (count % 2 === 0) availableDates.add(currentDate.format('YYYY-MM-DD'));
          count++;
        }
      }
      currentDate = currentDate.add(1, 'day');
    }
    return availableDates;
  };
  
  const availableDates = getAvailableDates();
  const isDateAvailable = (date: Dayjs) => availableDates.has(date.format('YYYY-MM-DD'));

  const generateTimeSlots = (): string[] => {
    if (config && selectedDate) {
      const dayName = selectedDate.format('dddd').toLowerCase();
      const dayTimes = config.availableTimes[dayName];
      
      if (dayTimes) {
        const slots: string[] = [];
        const [openHour, openMin] = dayTimes.openTime.split(':').map(Number);
        const [closeHour, closeMin] = dayTimes.closeTime.split(':').map(Number);
        
        let current = openHour * 60 + openMin;
        const end = closeHour * 60 + closeMin;
        
        while (current < end) {
          const hour = Math.floor(current / 60);
          const min = current % 60;
          slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
          current += 30;
        }
        return slots;
      }
    }
    
    return [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'
    ];
  };

  const timeSlots = generateTimeSlots();

  const handleSubmit = () => {
    console.log('Booking submitted:', { 
      type: consultationType, 
      date: selectedDate?.format('YYYY-MM-DD'), 
      time: selectedTime, 
      timezone: selectedTimezone, 
      ...formData,
      config 
    });
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setStep(config?.isSystemBooking ? 1 : (config ? 2 : 1));
    if (!config) setConsultationType(null);
    setSelectedDate(null);
    setSelectedTime('');
    setFormData({ name: '', email: '', company: '', projectDescription: '' });
    setIsSubmitted(false);
    setCurrentCalendarMonth(dayjs().month());
  };

  const handleConsultationTypeSelect = (type: any) => {
    setConsultationType(type);
    setStep(2);
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2); 
    } else if (step === 2) {
      const shouldGoToStep1 = config?.isSystemBooking || !config;
      setStep(shouldGoToStep1 ? 1 : 2);
      if (shouldGoToStep1) {
        setConsultationType(null);
      }
      setSelectedDate(null);
      setSelectedTime('');
    }
  };

  const getMonthDays = (monthIndex: number): Dayjs[][] => {
    const year = dayjs().year();
    const firstDayOfMonth = dayjs(new Date(year, monthIndex, 1)).day();
    let currentMonthCount = 0 - firstDayOfMonth;
    return new Array(6).fill([]).map(() => new Array(7).fill(null).map(() => {
      currentMonthCount++;
      return dayjs(new Date(year, monthIndex, currentMonthCount));
    }));
  };

  const handlePrevCalendarMonth = () => setCurrentCalendarMonth(currentCalendarMonth - 1);
  const handleNextCalendarMonth = () => setCurrentCalendarMonth(currentCalendarMonth + 1);

  const getCurrentTimezoneDisplay = () => {
    return getTimezoneDisplay(selectedTimezone);
  };

  const displayConfig = config?.isSystemBooking && consultationType
    ? SYSTEM_BOOKING_CONSULTATIONS.find(t => t.id === consultationType)
    : config 
      ? {
          title: config.consultationType,
          duration: config.duration + ' minutes',
          description: config.description,
          icon: '📅',
          color: 'from-blue-500 to-blue-600'
        }
      : consultationType 
        ? SYSTEM_BOOKING_CONSULTATIONS.find(t => t.id === consultationType)
        : null;

  const wrapperClasses = mode === 'popup' 
    ? 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'
    : 'w-full max-w-4xl mx-auto';

  const containerClasses = mode === 'popup'
    ? `bg-white rounded-2xl shadow-2xl transition-all duration-300 ease-in-out ${consultationType || config ? 'max-w-4xl h-[85vh]' : 'max-w-2xl h-auto'} w-full relative flex flex-col md:flex-row overflow-hidden`
    : `bg-white rounded-xl border border-gray-200 shadow-sm w-full relative flex flex-col md:flex-row overflow-hidden`;

  if (!isOpen && mode === 'popup') return null;

  // PAUSED STATE UI
  if (isBookingPaused || allVariantsPaused) {
    return (
      <div className={wrapperClasses}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center relative mx-auto"
        >
          {mode === 'popup' && (
            <button 
              onClick={() => { resetForm(); onClose(); }} 
              className="absolute top-3 right-3 p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ delay: 0.2, type: 'spring' }} 
            className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </motion.div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Currently Unavailable</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {allVariantsPaused 
              ? 'All consultation types are currently paused.'
              : 'This booking has been temporarily paused.'
            }
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
            <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2">Need Assistance?</p>
            <p className="text-sm text-blue-800 font-medium">
              Please contact <span className="font-bold">{config?.companyName || 'the company'}</span> for support.
            </p>
          </div>

          {mode === 'popup' && (
            <button 
              onClick={() => { resetForm(); onClose(); }} 
              className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all"
            >
              Close
            </button>
          )}

          <div className="mt-6 flex items-center justify-center space-x-1.5 opacity-40">
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Powered by</span>
            <span className="text-[11px] font-bold text-blue-900 tracking-widest">CEREFORGE</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className={wrapperClasses}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center relative mx-auto">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-sm text-gray-500 mb-6">A calendar invitation has been sent to your email address.</p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
            <p className="font-semibold text-blue-900 text-sm">{selectedDate?.format('dddd, MMMM D, YYYY')}</p>
            <p className="text-blue-700 font-bold text-lg">{selectedTime}</p>
            <p className="text-xs text-blue-500 mt-1">{getCurrentTimezoneDisplay()}</p>
          </div>
          <button onClick={() => { resetForm(); onClose(); }} className="w-full px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/20">Done</button>
          <div className="mt-6 flex items-center justify-center space-x-1.5 opacity-40">
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Powered by</span>
            <span className="text-[11px] font-bold text-blue-900 tracking-widest">CEREFORGE</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      <motion.div initial={mode === 'popup' ? { opacity: 0, scale: 0.95 } : { opacity: 0, y: 10 }} animate={mode === 'popup' ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 }} className={containerClasses}>
        {mode === 'popup' && (
          <button onClick={() => { resetForm(); onClose(); }} className="absolute top-3 right-3 z-50 p-2 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors shadow-sm border border-gray-100">
            <X className="w-4 h-4" />
          </button>
        )}

        {(consultationType || config) && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`hidden md:flex md:w-64 bg-slate-900 text-white p-5 flex-col flex-shrink-0 ${mode === 'standalone' ? 'rounded-l-xl' : ''}`}>
            <div className="mb-8 mt-4">
              <div className={`w-10 h-10 bg-gradient-to-br ${displayConfig?.color} rounded-lg flex items-center justify-center text-lg shadow-lg mb-3`}>{displayConfig?.icon}</div>
              <h3 className="font-bold text-sm leading-tight mb-1">{displayConfig?.title}</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">{displayConfig?.description}</p>
              {config && <p className="text-slate-300 text-xs mt-2 font-medium">{config.companyName}</p>}
            </div>
            <div className="space-y-3 mt-auto">
              <div className="border-t border-slate-800 pt-3">
                <div className="flex items-center space-x-3 mb-2"><Clock className="w-4 h-4 text-slate-500" /><span className="text-xs text-slate-300">{displayConfig?.duration}</span></div>
                <div className="flex items-center space-x-3"><Video className="w-4 h-4 text-slate-500" /><span className="text-xs text-slate-300">Cereforge Meet</span></div>
              </div>
              {selectedDate && selectedTime && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 animate-fade-in">
                  <p className="text-xs font-medium text-white mb-0.5">{selectedDate.format('MMM D, YYYY')}</p>
                  <p className="text-xs text-slate-400">{selectedTime}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div className="flex-1 flex flex-col bg-white overflow-hidden relative h-full">
          <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0 pr-12">
            <h2 className="text-lg font-bold text-gray-900">
              {step === 1 && 'Select Consultation Type'}
              {step === 2 && 'Select Date & Time'}
              {step === 3 && 'Enter Your Details'}
            </h2>
            <div className="flex space-x-1 mt-2 w-full max-w-[200px]">
              {(config?.isSystemBooking || !config) ? (
                [1, 2, 3].map(s => <div key={s} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${s <= step ? 'bg-blue-600' : 'bg-gray-100'}`} />)
              ) : (
                [2, 3].map(s => <div key={s} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${s <= step ? 'bg-blue-600' : 'bg-gray-100'}`} />)
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            <AnimatePresence mode="wait">
              {step === 1 && (!config || config.isSystemBooking) && (
                <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                  {activeVariants.map((type) => (
                    <motion.div key={type.id} whileHover={{ scale: 1.01, borderColor: '#3b82f6' }} whileTap={{ scale: 0.99 }} onClick={() => handleConsultationTypeSelect(type.id)} className="p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md cursor-pointer transition-all group flex items-center gap-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${type.color} rounded-lg flex items-center justify-center text-lg text-white shadow-sm flex-shrink-0`}>{type.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <h4 className="text-sm font-bold text-gray-900">{type.title}</h4>
                          <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{type.duration}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{type.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col lg:flex-row gap-6 h-full justify-center">
                  <div className="flex-1 max-w-[340px] flex flex-col mx-auto lg:mx-0">
                    <button onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)} className="w-full mb-4 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors flex items-center justify-between text-xs font-medium text-gray-600 border border-transparent hover:border-gray-200">
                      <span className="flex items-center truncate"><Globe className="w-3 h-3 mr-2 text-gray-400" />{getCurrentTimezoneDisplay()}</span>
                      <ChevronRight className={`w-3 h-3 transition-transform ${showTimezoneDropdown ? 'rotate-90' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showTimezoneDropdown && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-4 overflow-hidden border border-gray-100 rounded-lg shadow-sm">
                          <div className="p-2 bg-gray-50">
                            <input type="text" value={timezoneSearch} onChange={(e) => setTimezoneSearch(e.target.value)} placeholder="Search..." className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded focus:outline-none focus:border-blue-500" />
                          </div>
                          <div className="max-h-32 overflow-y-auto">
                            {filteredTimezones.map(tz => (
                              <button key={tz.value} onClick={() => { setSelectedTimezone(tz.value); setShowTimezoneDropdown(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-gray-700 truncate">{tz.label}</button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-4 px-1">
                        <button onClick={handlePrevCalendarMonth} className="p-1 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="text-sm font-bold text-gray-800">{dayjs(new Date(dayjs().year(), currentCalendarMonth)).format('MMMM YYYY')}</span>
                        <button onClick={handleNextCalendarMonth} className="p-1 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-400">{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {getMonthDays(currentCalendarMonth).flat().map((day, idx) => {
                          const isCurrentMonth = day.month() === currentCalendarMonth;
                          const isAvailable = isDateAvailable(day) && isCurrentMonth;
                          const isSelected = selectedDate?.format('YYYY-MM-DD') === day.format('YYYY-MM-DD');
                          return (
                            <button key={idx} onClick={() => isAvailable && setSelectedDate(day)} disabled={!isAvailable} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200 relative ${!isCurrentMonth ? 'invisible' : ''} ${isSelected ? 'bg-blue-600 text-white shadow-md scale-100 z-10' : ''} ${!isSelected && isAvailable ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' : ''} ${!isSelected && !isAvailable ? 'text-gray-300 cursor-not-allowed' : ''}`}>
                              {day.date()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {selectedDate && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-40 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
                      <h4 className="text-xs font-bold text-gray-900 mb-3 sticky top-0 bg-white z-10 py-1">{selectedDate.format('ddd, MMM D')}</h4>
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 max-h-[350px]">
                        {timeSlots.map((time) => (
                          <button key={time} onClick={() => { setSelectedTime(time); setStep(3); }} className={`w-full px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${selectedTime === time ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'}`}>{time}</button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md mx-auto py-2">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Name or Company Name</label>
                        <input 
                          type="text" 
                          value={formData.name} 
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                          className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" 
                          placeholder="Your full name" 
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                        <input 
                          type="email" 
                          value={formData.email} 
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                          className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" 
                          placeholder="you@company.com" 
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Topic</label>
                        <textarea 
                          value={formData.projectDescription} 
                          onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })} 
                          rows={3} 
                          className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none" 
                          placeholder="What would you like to discuss?" 
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {step > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-white flex items-center justify-between flex-shrink-0 z-20">
              <div className="w-24">
                {(step > 2 || (step === 2 && (config?.isSystemBooking || !config))) && (
                  <button onClick={handleBack} className="flex items-center text-gray-500 hover:text-gray-800 transition-colors text-xs font-semibold px-2 py-1.5 rounded-lg hover:bg-gray-100">
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />Back
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-1.5 opacity-50 select-none">
                <Zap className="w-3 h-3 text-gray-400" fill="currentColor" />
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Powered by</span>
                <span className="text-[10px] font-bold text-blue-900 tracking-widest">CEREFORGE</span>
              </div>
              <div className="w-24 flex justify-end">
                {step === 3 && (
                  <motion.button 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }} 
                    onClick={handleSubmit} 
                    disabled={!formData.name || !formData.email} 
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Confirm</span>
                    <CheckCircle className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ConsultationBooking;