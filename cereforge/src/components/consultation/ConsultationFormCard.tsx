// src/components/consultation/ConsultationFormCard.tsx

import { useState } from 'react';
import { Trash2, Globe, ChevronRight, Power, PowerOff, Clock, Building2, FileText, CalendarClock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConsultationFormData, DURATION_OPTIONS, BUFFER_OPTIONS, DAYS_OF_WEEK } from '@/utils/ConsultationConstants';
import { filterTimezones, getTimezoneDisplay } from '@/utils/TimezoneUtils';

interface ConsultationFormCardProps {
  index: number;
  initialData: ConsultationFormData;
  onRemove?: () => void;
  showRemove: boolean;
  onChange: (data: ConsultationFormData) => void;
}

const ConsultationFormCard = ({ 
  index, 
  initialData, 
  onRemove, 
  showRemove,
  onChange 
}: ConsultationFormCardProps) => {
  const formData = initialData;
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');

  const filteredTimezones = filterTimezones(timezoneSearch);

  // --- LOGIC PRESERVED FROM ORIGINAL ---
  const handleFieldUpdate = (field: keyof ConsultationFormData, value: any) => {
    onChange({ ...formData, [field]: value });
  };

  const handleDayToggle = (day: string) => {
    const newSchedule = {
      ...formData.schedule,
      [day]: {
        ...formData.schedule[day as keyof typeof formData.schedule],
        enabled: !formData.schedule[day as keyof typeof formData.schedule].enabled
      }
    };
    onChange({ ...formData, schedule: newSchedule });
  };

  const handleTimeUpdate = (day: string, type: 'openTime' | 'closeTime', value: string) => {
    const newSchedule = {
      ...formData.schedule,
      [day]: {
        ...formData.schedule[day as keyof typeof formData.schedule],
        [type]: value
      }
    };
    onChange({ ...formData, schedule: newSchedule });
  };
  // -------------------------------------

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      {/* Header Bar */}
      <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${formData.isActive ? 'bg-white' : 'bg-gray-50/80'}`}>
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${formData.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
            {index + 1}
          </div>
          <div>
            <h4 className={`text-sm font-bold ${formData.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
              {formData.consultationType || 'Untitled Consultation'}
            </h4>
            <p className="text-xs text-gray-500">
              {formData.companyName || 'No Company Name'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Active Toggle */}
          <button
            type="button"
            onClick={() => handleFieldUpdate('isActive', !formData.isActive)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              formData.isActive
                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {formData.isActive ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
            <span>{formData.isActive ? 'Active' : 'Paused'}</span>
          </button>
          
          {showRemove && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid - The "Split Layout" */}
      <div className={`p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 ${!formData.isActive && 'opacity-60 grayscale-[0.5] pointer-events-none'}`}>
        
        {/* LEFT COLUMN: Configuration (Span 5) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            <Building2 className="w-3 h-3" />
            <span>Details</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Consultation Type</label>
              <input
                type="text"
                value={formData.consultationType}
                onChange={(e) => handleFieldUpdate('consultationType', e.target.value)}
                placeholder="e.g. Discovery Call"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleFieldUpdate('companyName', e.target.value)}
                placeholder="e.g. Cereforge"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                  <select
                    value={formData.duration}
                    onChange={(e) => handleFieldUpdate('duration', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none appearance-none transition-all"
                  >
                    {DURATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Buffer</label>
                <select
                  value={formData.bufferHours}
                  onChange={(e) => handleFieldUpdate('bufferHours', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                >
                  {BUFFER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Timezone</label>
              <button
                type="button"
                onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-left transition-colors flex items-center justify-between text-xs sm:text-sm text-gray-700"
              >
                <span className="flex items-center truncate">
                  <Globe className="w-3.5 h-3.5 mr-2 text-gray-400" />
                  {getTimezoneDisplay(formData.timezone)}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showTimezoneDropdown ? 'rotate-90' : ''}`} />
              </button>

              <AnimatePresence>
                {showTimezoneDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl"
                  >
                    <div className="p-2 border-b border-gray-50">
                      <input
                        type="text"
                        value={timezoneSearch}
                        onChange={(e) => setTimezoneSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      {filteredTimezones.map(tz => (
                        <button
                          key={tz.value}
                          type="button"
                          onClick={() => {
                            handleFieldUpdate('timezone', tz.value);
                            setShowTimezoneDropdown(false);
                            setTimezoneSearch('');
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-gray-700 transition-colors truncate"
                        >
                          {tz.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFieldUpdate('description', e.target.value)}
                  placeholder="What is this consultation about?"
                  rows={2}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Schedule (Span 7) */}
        <div className="lg:col-span-7 lg:border-l lg:border-gray-100 lg:pl-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <CalendarClock className="w-3 h-3" />
              <span>Weekly Schedule</span>
            </div>
            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded">24-hour format</span>
          </div>

          <div className="space-y-1">
            {DAYS_OF_WEEK.map(({ key, label }) => {
              const daySchedule = formData.schedule[key as keyof typeof formData.schedule];
              
              return (
                <div
                  key={key}
                  className={`group flex items-center justify-between py-2 px-3 rounded-lg border transition-all duration-200 ${
                    daySchedule.enabled 
                      ? 'bg-white border-gray-200 shadow-sm' 
                      : 'bg-gray-50 border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center h-full">
                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        daySchedule.enabled ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                      }`}>
                        {daySchedule.enabled && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={daySchedule.enabled}
                        onChange={() => handleDayToggle(key)}
                        className="hidden"
                      />
                      <span className={`text-sm font-medium ${daySchedule.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                        {label}
                      </span>
                    </label>
                  </div>

                  <div className={`flex items-center space-x-2 transition-all duration-300 ${daySchedule.enabled ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                    <div className="relative group/time">
                      <input
                        type="time"
                        value={daySchedule.openTime}
                        onChange={(e) => handleTimeUpdate(key, 'openTime', e.target.value)}
                        className="w-20 px-2 py-1 text-xs font-medium text-center bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <span className="text-gray-300 text-xs">–</span>
                    <div className="relative group/time">
                      <input
                        type="time"
                        value={daySchedule.closeTime}
                        onChange={(e) => handleTimeUpdate(key, 'closeTime', e.target.value)}
                        className="w-20 px-2 py-1 text-xs font-medium text-center bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ConsultationFormCard;