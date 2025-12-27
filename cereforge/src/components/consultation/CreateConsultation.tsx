import { useState, useEffect } from 'react';
import { ChevronLeft, Save, Plus, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import ConsultationFormCard from './ConsultationFormCard';
import { ConsultationFormData, EMPTY_CONSULTATION_FORM, SYSTEM_BOOKING_CONSULTATIONS } from '@/utils/ConsultationConstants';
import { useAppSelector } from '@/store/hook';
import { selectUser } from '@/store/slices/authSlice';

interface CreateConsultationProps {
  editingId: string | null;
  onBack: () => void;
}

const CreateConsultation = ({ editingId, onBack }: CreateConsultationProps) => {
  const user = useAppSelector(selectUser);
  const isAdminOrCore = user?.role === 'admin' || user?.role === 'core';
  
  const [isSystemBooking, setIsSystemBooking] = useState(false);
  const [consultations, setConsultations] = useState<ConsultationFormData[]>([
    { ...EMPTY_CONSULTATION_FORM }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Load consultation data when editing
  useEffect(() => {
    if (editingId) {
      loadConsultationForEditing(editingId);
    }
  }, [editingId]);

  const loadConsultationForEditing = async (id: string) => {
    setIsLoading(true);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/consultations/${id}`);
      // const data = await response.json();
      
      // ✅ MOCK: Simulate fetching consultation data
      // For now, check if it's system booking
      if (id === 'system_booking_consult') {
        // ✅ Load system booking consultations from constants
        const systemConsults: ConsultationFormData[] = SYSTEM_BOOKING_CONSULTATIONS.map((type) => ({
          consultationType: type.title,
          companyName: 'Cereforge',
          duration: type.duration.replace(' minutes', ''),
          description: type.description,
          bufferHours: 48,
          timezone: 'Africa/Lagos', // ✅ Default Cereforge timezone
          isActive: true, // ✅ Default to active
          schedule: {
            monday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
            tuesday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
            wednesday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
            thursday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
            friday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
            saturday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
            sunday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
          },
          isSystemBooking: true
        }));
        
        setConsultations(systemConsults);
        setIsSystemBooking(true);
      } else {
        // ✅ Load individual booking consultations
        // TODO: This will come from backend
        // For now, simulate with mock data
        const mockIndividualConsults: ConsultationFormData[] = [
          {
            consultationType: 'Client Discovery',
            companyName: 'My Company',
            duration: '30',
            description: 'Initial client meeting',
            bufferHours: 48,
            timezone: 'America/New_York', // ✅ Example timezone
            isActive: true, // ✅ Active by default
            schedule: {
              monday: { enabled: true, openTime: '10:00', closeTime: '16:00' },
              tuesday: { enabled: true, openTime: '10:00', closeTime: '16:00' },
              wednesday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
              thursday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
              friday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
              saturday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
              sunday: { enabled: false, openTime: '09:00', closeTime: '17:00' },
            },
            isSystemBooking: false
          }
        ];
        
        setConsultations(mockIndividualConsults);
        setIsSystemBooking(false);
      }
    } catch (error) {
      console.error('Error loading consultation:', error);
      alert('Failed to load consultation data');
      onBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddConsultation = () => {
    const maxAllowed = isSystemBooking ? Infinity : 2;
    
    if (consultations.length < maxAllowed) {
      setConsultations([...consultations, { ...EMPTY_CONSULTATION_FORM, isSystemBooking }]);
    }
  };

  const handleRemoveConsultation = (index: number) => {
    setConsultations(consultations.filter((_, i) => i !== index));
  };

  const handleConsultationChange = (index: number, data: ConsultationFormData) => {
    const updated = [...consultations];
    updated[index] = { ...data, isSystemBooking };
    setConsultations(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all consultations
    for (const consultation of consultations) {
      if (!consultation.consultationType || !consultation.companyName) {
        alert('Please fill in all required fields for each consultation');
        return;
      }

      const enabledDays = Object.values(consultation.schedule).filter(day => day.enabled);
      if (enabledDays.length === 0) {
        alert(`Please select at least one available day for ${consultation.consultationType}`);
        return;
      }
    }

    // ✅ Prepare data for saving
    const bookingGroupId = editingId || (isSystemBooking 
      ? 'system_booking_consult' 
      : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    
    const bookingData = {
      id: bookingGroupId,
      isSystemBooking,
      consultations: consultations.map((consultation, index) => {
        const companySlug = consultation.companyName.toLowerCase().replace(/\s+/g, '-');
        const typeSlug = consultation.consultationType.toLowerCase().replace(/\s+/g, '-');
        const consultationId = `${bookingGroupId}_${index}`;
        
        return {
          id: consultationId,
          ...consultation,
          bookingLink: `/book/${companySlug}/${typeSlug}/${consultationId}`,
        };
      }),
      createdAt: editingId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // TODO: Save to backend
    console.log('Saving booking group:', bookingData);
    
    alert(`${consultations.length} consultation(s) ${editingId ? 'updated' : 'saved'} successfully!`);
    onBack();
  };

  const isFormValid = consultations.every(consultation => 
    consultation.consultationType && 
    consultation.companyName && 
    Object.values(consultation.schedule).some(day => day.enabled)
  );

  const maxConsultations = isSystemBooking ? Infinity : 2;
  const canAddMore = consultations.length < maxConsultations;

  // ✅ Show loading state while fetching
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading consultation data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to list</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {editingId ? 'Edit Consultation' : 'Create New Consultation'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {isSystemBooking 
                ? 'System Booking - Unlimited consultations' 
                : 'Individual Booking - Max 2 consultations'}
            </p>
            {editingId && (
              <p className="text-xs text-blue-600 mt-1">
                Editing: {consultations.length} consultation{consultations.length > 1 ? 's' : ''} in this group
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
           
            {/* Add More Button */}
            {canAddMore && (
              <button
                type="button"
                onClick={handleAddConsultation}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add {isSystemBooking ? 'More' : '1 More'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ✅ System Booking Toggle - Only show when creating new (not editing) */}
      {isAdminOrCore && !editingId && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Booking Type</h4>
              <p className="text-xs text-gray-600">
                {isSystemBooking 
                  ? 'System bookings allow unlimited consultations and are used for Cereforge team availability' 
                  : 'Individual bookings are limited to 2 consultations per creation'}
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                if (consultations.length > 2 && !isSystemBooking) {
                  alert('Please remove extra consultations before switching to Individual Booking (max 2)');
                  return;
                }
                setIsSystemBooking(!isSystemBooking);
                // Update all consultations with new flag
                setConsultations(consultations.map(c => ({ ...c, isSystemBooking: !isSystemBooking })));
              }}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isSystemBooking ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                  isSystemBooking ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="mt-3 flex items-center space-x-4 text-xs">
            <span className={`font-medium ${!isSystemBooking ? 'text-blue-600' : 'text-gray-500'}`}>
              Individual Booking
            </span>
            <span className={`font-medium ${isSystemBooking ? 'text-blue-600' : 'text-gray-500'}`}>
              System Booking
            </span>
          </div>
        </div>
      )}

      {/* ✅ Editing Info Banner */}
      {editingId && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900">Editing Mode</h4>
              <p className="text-xs text-blue-700 mt-1">
                You are editing an existing {isSystemBooking ? 'system' : 'individual'} booking with {consultations.length} consultation{consultations.length > 1 ? 's' : ''}. 
                Changes will update all consultations in this group.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Consultation Forms */}
        {consultations.map((consultation, index) => (
          <ConsultationFormCard
            key={index}
            index={index}
            initialData={consultation}
            onRemove={() => handleRemoveConsultation(index)}
            showRemove={consultations.length > 1}
            onChange={(data) => handleConsultationChange(index, data)}
          />
        ))}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 bg-white sticky bottom-0 py-4">
          <div className="w-24">
            {/* Placeholder for symmetry */}
          </div>

          <div className="flex items-center space-x-1.5 opacity-50 select-none">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Powered by</span>
            <span className="text-[10px] font-bold text-blue-900 tracking-widest">CEREFORGE</span>
          </div>

          <div className="w-24 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!isFormValid}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>
                {editingId ? 'Update' : 'Create'}{' '}
                {consultations.length > 1 ? `${consultations.length} Consultations` : 'Consultation'}
                {isSystemBooking && ' (System)'}
              </span>
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateConsultation;