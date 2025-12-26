import { useState, useEffect } from 'react';
import { ChevronLeft, Save, Eye } from 'lucide-react';

interface DaySchedule {
  enabled: boolean;
  openTime: string;
  closeTime: string;
}

interface ConsultationFormData {
  consultationType: string;
  companyName: string;
  duration: string;
  description: string;
  bufferHours: number;
  schedule: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
}

interface CreateConsultationProps {
  editingId: string | null;
  onBack: () => void;
}

const CreateConsultation = ({ editingId, onBack }: CreateConsultationProps) => {
  const [formData, setFormData] = useState<ConsultationFormData>({
    consultationType: '',
    companyName: '',
    duration: '30',
    description: '',
    bufferHours: 48,
    schedule: {
      monday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
      tuesday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
      wednesday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
      thursday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
      friday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
      saturday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
      sunday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
    }
  });

  const [_showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (editingId) {
      // TODO: Load consultation data for editing
      console.log('Loading consultation:', editingId);
    }
  }, [editingId]);

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const bufferOptions = [
    { value: 24, label: '24 hours' },
    { value: 48, label: '48 hours' },
    { value: 72, label: '72 hours' },
    { value: 96, label: '96 hours' },
  ];

  const handleDayToggle = (day: string) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        [day]: {
          ...formData.schedule[day as keyof typeof formData.schedule],
          enabled: !formData.schedule[day as keyof typeof formData.schedule].enabled
        }
      }
    });
  };

  const handleTimeChange = (day: string, type: 'openTime' | 'closeTime', value: string) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        [day]: {
          ...formData.schedule[day as keyof typeof formData.schedule],
          [type]: value
        }
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.consultationType || !formData.companyName) {
      alert('Please fill in all required fields');
      return;
    }

    const enabledDays = Object.values(formData.schedule).filter(day => day.enabled);
    if (enabledDays.length === 0) {
      alert('Please select at least one available day');
      return;
    }

    // TODO: Save consultation to storage/API
    console.log('Saving consultation:', formData);
    
    // Generate unique ID and link
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const companySlug = formData.companyName.toLowerCase().replace(/\s+/g, '-');
    const typeSlug = formData.consultationType.toLowerCase().replace(/\s+/g, '-');
    const bookingLink = `/book/${companySlug}/${typeSlug}/${uniqueId}`;
    
    console.log('Generated booking link:', bookingLink);
    
    alert('Consultation saved successfully!');
    onBack();
  };

  const isFormValid = formData.consultationType && formData.companyName && 
    Object.values(formData.schedule).some(day => day.enabled);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to list</span>
        </button>
        <h3 className="text-2xl font-bold text-gray-900">
          {editingId ? 'Edit Consultation' : 'Create New Consultation'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">Configure your booking consultation settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Consultation Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.consultationType}
                onChange={(e) => setFormData({ ...formData, consultationType: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g., Tech Solutions Ltd"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Buffer Between Bookings
              </label>
              <select
                value={formData.bufferHours}
                onChange={(e) => setFormData({ ...formData, bufferHours: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                {bufferOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this consultation"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Availability Schedule */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4">Availability Schedule</h4>
          <p className="text-sm text-gray-500 mb-4">Select the days you're available and set your working hours</p>

          <div className="space-y-3">
            {daysOfWeek.map(({ key, label }) => {
              const daySchedule = formData.schedule[key as keyof typeof formData.schedule];
              
              return (
                <div
                  key={key}
                  className={`border rounded-lg p-4 transition-all ${
                    daySchedule.enabled ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={daySchedule.enabled}
                        onChange={() => handleDayToggle(key)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label className="font-semibold text-gray-900">{label}</label>
                    </div>

                    {daySchedule.enabled && (
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-gray-600">From:</label>
                          <input
                            type="time"
                            value={daySchedule.openTime}
                            onChange={(e) => handleTimeChange(key, 'openTime', e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-gray-600">To:</label>
                          <input
                            type="time"
                            value={daySchedule.closeTime}
                            onChange={(e) => handleTimeChange(key, 'closeTime', e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={!isFormValid}
            className="flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>

          <button
            type="submit"
            disabled={!isFormValid}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{editingId ? 'Update' : 'Create'} Consultation</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateConsultation;