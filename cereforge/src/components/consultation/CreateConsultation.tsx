// src/components/consultation/CreateConsultation.tsx

import { useState, useEffect } from 'react';
import { ChevronLeft, Save, Plus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  useEffect(() => {
    if (editingId) {
      loadConsultationForEditing(editingId);
    }
  }, [editingId]);

  const loadConsultationForEditing = async (id: string) => {
    setIsLoading(true);
    try {
      if (id === 'system_booking_consult') {
        // Load System Booking consultations with isActive status
        const systemConsults: ConsultationFormData[] = SYSTEM_BOOKING_CONSULTATIONS.map((type) => ({
          consultationType: type.title,
          companyName: 'Cereforge',
          duration: type.duration.replace(' minutes', ''),
          description: type.description,
          bufferHours: 48,
          timezone: 'Africa/Lagos',
          isActive: true, // ✅ System bookings default to active when editing
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
        // TODO: Replace with actual API call when backend is ready
        // For now, mock individual consultation data
        const mockIndividualConsults: ConsultationFormData[] = [
          {
            consultationType: 'Client Discovery',
            companyName: 'My Company',
            duration: '30',
            description: 'Initial client meeting',
            bufferHours: 48,
            timezone: 'America/New_York',
            isActive: true, // ✅ Load actual isActive status from API
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
      setConsultations([
        ...consultations, 
        { 
          ...EMPTY_CONSULTATION_FORM, 
          isSystemBooking,
          isActive: true // ✅ New consultations default to active
        }
      ]);
    }
  };

  const handleRemoveConsultation = (index: number) => {
    setConsultations(consultations.filter((_, i) => i !== index));
  };

  const handleConsultationChange = (index: number, data: ConsultationFormData) => {
    const updated = [...consultations];
    updated[index] = { 
      ...data, 
      isSystemBooking,
      // ✅ Preserve isActive status when updating
      isActive: data.isActive 
    };
    setConsultations(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
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
          consultationType: consultation.consultationType,
          companyName: consultation.companyName,
          duration: consultation.duration,
          description: consultation.description,
          bufferHours: consultation.bufferHours,
          timezone: consultation.timezone, // ✅ Include timezone
          isActive: consultation.isActive, // ✅ Include isActive status
          schedule: consultation.schedule,
          isSystemBooking: consultation.isSystemBooking,
          bookingLink: `/book/${companySlug}/${typeSlug}/${consultationId}`,
        };
      }),
      createdAt: editingId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Saving booking group:', bookingData);
    
    // TODO: Replace with actual API call when backend is ready
    // Example: await dispatch(createConsultation(bookingData)).unwrap();
    
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-sm text-gray-500 font-medium">Loading details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 -mx-6 px-6 py-4 mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-full transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {editingId ? 'Edit Configuration' : 'Create New Booking'}
            </h3>
            <p className="text-xs text-gray-500">
              {isSystemBooking ? 'System-wide Availability' : 'Individual Consultation Link'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {canAddMore && (
            <button
              type="button"
              onClick={handleAddConsultation}
              className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 font-medium text-xs rounded-lg transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Variant</span>
            </button>
          )}
          <button
            onClick={(e) => handleSubmit(e as any)}
            disabled={!isFormValid}
            className="flex items-center space-x-2 px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{editingId ? 'Update Changes' : 'Save Booking'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Configuration Type Selector (Only on Create) */}
        {isAdminOrCore && !editingId && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-1 shadow-sm border border-gray-200 inline-flex"
          >
            <button
              onClick={() => {
                if (consultations.length > 2 && !isSystemBooking) {
                   alert('Please remove extra consultations first');
                   return;
                }
                setIsSystemBooking(false);
                setConsultations(consultations.map(c => ({ 
                  ...c, 
                  isSystemBooking: false,
                  isActive: c.isActive // ✅ Preserve isActive when switching
                })));
              }}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                !isSystemBooking 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Individual Booking
            </button>
            <button
              onClick={() => {
                setIsSystemBooking(true);
                setConsultations(consultations.map(c => ({ 
                  ...c, 
                  isSystemBooking: true,
                  isActive: c.isActive // ✅ Preserve isActive when switching
                })));
              }}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                isSystemBooking 
                  ? 'bg-purple-50 text-purple-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              System Booking
            </button>
          </motion.div>
        )}

        {/* Info Banner for Editing */}
        {editingId && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex items-start gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-800"
          >
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold">Editing Mode:</span> Changes made here will update the live booking links immediately. 
              {isSystemBooking && " You are modifying global system availability."}
            </div>
          </motion.div>
        )}

        {/* Forms List */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <AnimatePresence mode="popLayout">
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
          </AnimatePresence>

          {/* Bottom Action Area (for Mobile/Convenience) */}
          {canAddMore && (
             <motion.button
               type="button"
               onClick={handleAddConsultation}
               whileHover={{ scale: 1.01 }}
               whileTap={{ scale: 0.99 }}
               className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex items-center justify-center space-x-2 text-sm font-medium"
             >
               <Plus className="w-4 h-4" />
               <span>Add Another Consultation Variant</span>
             </motion.button>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateConsultation;