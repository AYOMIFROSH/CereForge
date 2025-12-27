// src/utils/consultationUtils.ts

import { ConsultationFormData, CEREFORGE_DEFAULT_CONSULTATIONS } from './ConsultationConstants';

/**
 * Generate Cereforge default consultations with company name
 * Used by Admin and Core team to quickly create standard consultations
 */
export const generateCereforgeConsultations = (companyName: string = 'Cereforge'): ConsultationFormData[] => {
  return CEREFORGE_DEFAULT_CONSULTATIONS.map(template => ({
    ...template,
    companyName
  }));
};

/**
 * Generate unique booking link
 */
export const generateBookingLink = (companyName: string, consultationType: string): string => {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const companySlug = companyName.toLowerCase().replace(/\s+/g, '-');
  const typeSlug = consultationType.toLowerCase().replace(/\s+/g, '-');
  return `/book/${companySlug}/${typeSlug}/${uniqueId}`;
};

/**
 * Validate consultation form data
 */
export const validateConsultation = (consultation: ConsultationFormData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!consultation.consultationType.trim()) {
    errors.push('Consultation type is required');
  }

  if (!consultation.companyName.trim()) {
    errors.push('Company name is required');
  }

  const enabledDays = Object.values(consultation.schedule).filter(day => day.enabled);
  if (enabledDays.length === 0) {
    errors.push('At least one available day must be selected');
  }

  // Validate times for enabled days
  enabledDays.forEach((day, index) => {
    if (day.openTime >= day.closeTime) {
      errors.push(`Invalid time range for day ${index + 1}: open time must be before close time`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Format consultation data for API
 */
export const formatConsultationForAPI = (consultation: ConsultationFormData) => {
  const enabledDays = Object.entries(consultation.schedule)
    .filter(([_, day]) => day.enabled)
    .reduce((acc, [key, day]) => ({
      ...acc,
      [key]: { openTime: day.openTime, closeTime: day.closeTime }
    }), {});

  return {
    consultationType: consultation.consultationType,
    companyName: consultation.companyName,
    duration: parseInt(consultation.duration),
    description: consultation.description,
    bufferHours: consultation.bufferHours,
    availableDays: Object.keys(enabledDays),
    availableTimes: enabledDays,
    bookingLink: generateBookingLink(consultation.companyName, consultation.consultationType),
    createdAt: new Date().toISOString()
  };
};