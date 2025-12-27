// src/components/consultation/ConsultationFormCard.tsx

import { useState } from 'react';
import { Trash2, Globe, ChevronRight, Power, PowerOff } from 'lucide-react';
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

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 relative">
      {/* Header with Remove Button and Active Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h4 className="text-lg font-bold text-gray-900">
            Consultation {index + 1}
          </h4>
          {/* ✅ Active/Paused Badge */}
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${
            formData.isActive 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {formData.isActive ? (
              <>
                <Power className="w-3 h-3" />
                <span>Active</span>
              </>
            ) : (
              <>
                <PowerOff className="w-3 h-3" />
                <span>Paused</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* ✅ Toggle Active/Paused */}
          <button
            type="button"
            onClick={() => handleFieldUpdate('isActive', !formData.isActive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              formData.isActive
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
            title={formData.isActive ? 'Pause bookings' : 'Resume bookings'}
          >
            {formData.isActive ? 'Pause' : 'Resume'}
          </button>
          
          {showRemove && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove this consultation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Consultation Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.consultationType}
              onChange={(e) => handleFieldUpdate('consultationType', e.target.value)}
              placeholder="e.g., Discovery Call"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleFieldUpdate('companyName', e.target.value)}
              placeholder="e.g., Cereforge"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
            <select
              value={formData.duration}
              onChange={(e) => handleFieldUpdate('duration', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              {DURATION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Buffer Between Bookings
            </label>
            <select
              value={formData.bufferHours}
              onChange={(e) => handleFieldUpdate('bufferHours', Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              {BUFFER_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ✅ NEW: Timezone Selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Timezone <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
              className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg text-left transition-colors flex items-center justify-between text-sm"
            >
              <span className="flex items-center truncate">
                <Globe className="w-4 h-4 mr-2 text-gray-500" />
                {getTimezoneDisplay(formData.timezone)}
              </span>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showTimezoneDropdown ? 'rotate-90' : ''}`} />
            </button>

            {showTimezoneDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    value={timezoneSearch}
                    onChange={(e) => setTimezoneSearch(e.target.value)}
                    placeholder="Search timezones..."
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredTimezones.map(tz => (
                    <button
                      key={tz.value}
                      type="button"
                      onClick={() => {
                        handleFieldUpdate('timezone', tz.value);
                        setShowTimezoneDropdown(false);
                        setTimezoneSearch('');
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 transition-colors"
                    >
                      {tz.label} <span className="text-gray-400">{tz.offset}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleFieldUpdate('description', e.target.value)}
            placeholder="Brief description of this consultation"
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
          />
        </div>
      </div>

      {/* Availability Schedule */}
      <div className="mt-6">
        <h5 className="text-sm font-bold text-gray-900 mb-3">Availability Schedule</h5>
        <div className="space-y-2">
          {DAYS_OF_WEEK.map(({ key, label }) => {
            const daySchedule = formData.schedule[key as keyof typeof formData.schedule];
            
            return (
              <div
                key={key}
                className={`border rounded-lg p-3 transition-all ${
                  daySchedule.enabled ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={daySchedule.enabled}
                      onChange={() => handleDayToggle(key)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="font-medium text-gray-900 text-sm">{label}</label>
                  </div>

                  {daySchedule.enabled && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={daySchedule.openTime}
                        onChange={(e) => handleTimeUpdate(key, 'openTime', e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <span className="text-xs text-gray-500">to</span>
                      <input
                        type="time"
                        value={daySchedule.closeTime}
                        onChange={(e) => handleTimeUpdate(key, 'closeTime', e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ConsultationFormCard;