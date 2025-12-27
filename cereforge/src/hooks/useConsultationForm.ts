// src/hooks/useConsultationForm.ts

import { useState } from 'react';
import { ConsultationFormData, EMPTY_CONSULTATION_FORM } from '@/utils/ConsultationConstants';

export const useConsultationForm = (initialData?: ConsultationFormData) => {
  const [formData, setFormData] = useState<ConsultationFormData>(
    initialData || EMPTY_CONSULTATION_FORM
  );

  const updateField = (field: keyof ConsultationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day as keyof typeof prev.schedule],
          enabled: !prev.schedule[day as keyof typeof prev.schedule].enabled
        }
      }
    }));
  };

  const updateDayTime = (day: string, type: 'openTime' | 'closeTime', value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day as keyof typeof prev.schedule],
          [type]: value
        }
      }
    }));
  };

  const resetForm = () => {
    setFormData(initialData || EMPTY_CONSULTATION_FORM);
  };

  const isValid = () => {
    if (!formData.consultationType || !formData.companyName) return false;
    const enabledDays = Object.values(formData.schedule).filter(day => day.enabled);
    return enabledDays.length > 0;
  };

  const getEnabledDays = () => {
    return Object.entries(formData.schedule)
      .filter(([_, day]) => day.enabled)
      .map(([key]) => key);
  };

  return {
    formData,
    setFormData,
    updateField,
    toggleDay,
    updateDayTime,
    resetForm,
    isValid,
    getEnabledDays
  };
};