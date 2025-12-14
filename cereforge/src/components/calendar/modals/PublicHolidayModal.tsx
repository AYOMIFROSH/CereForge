// src/components/calendar/modals/PublicHolidayModal.tsx - MINIMAL DESIGN
import React from 'react';
import { X, Calendar as CalendarIcon, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import type { CalendarEvent } from '@/types/calendar.types';

interface PublicHolidayViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  holiday: CalendarEvent;
}

// ✅ Context-aware SVG backgrounds for different holidays
const getHolidaySVG = (title: string) => {
  const lowerTitle = title.toLowerCase();
  
  // Christmas/Winter holidays
  if (lowerTitle.includes('christmas') || lowerTitle.includes('xmas')) {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 200">
        <circle cx="100" cy="80" r="30" fill="#ef4444"/>
        <circle cx="100" cy="120" r="40" fill="#ef4444"/>
        <circle cx="100" cy="170" r="50" fill="#ef4444"/>
        <path d="M 70 80 L 100 50 L 130 80" stroke="#10b981" strokeWidth="8" fill="none"/>
      </svg>
    );
  }
  
  // New Year
  if (lowerTitle.includes('new year')) {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="60" fill="none" stroke="#3b82f6" strokeWidth="4"/>
        <text x="100" y="115" textAnchor="middle" fontSize="48" fill="#3b82f6" fontWeight="bold">2025</text>
        <circle cx="160" cy="40" r="8" fill="#f59e0b">
          <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="40" cy="60" r="6" fill="#f59e0b">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      </svg>
    );
  }
  
  // Independence/National Day
  if (lowerTitle.includes('independence') || lowerTitle.includes('national')) {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 200">
        <rect x="50" y="60" width="100" height="80" fill="#3b82f6" opacity="0.5"/>
        <circle cx="100" cy="100" r="50" fill="none" stroke="#10b981" strokeWidth="8"/>
        <path d="M 100 80 L 110 100 L 100 120 L 90 100 Z" fill="#ef4444"/>
      </svg>
    );
  }
  
  // Easter/Spring holidays
  if (lowerTitle.includes('easter') || lowerTitle.includes('spring')) {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 200">
        <ellipse cx="100" cy="120" rx="40" ry="50" fill="#a855f7"/>
        <ellipse cx="100" cy="80" rx="35" ry="40" fill="#a855f7"/>
        <circle cx="85" cy="75" r="5" fill="#1f2937"/>
        <circle cx="115" cy="75" r="5" fill="#1f2937"/>
      </svg>
    );
  }
  
  // Thanksgiving/Harvest
  if (lowerTitle.includes('thanksgiving') || lowerTitle.includes('harvest')) {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 200">
        <path d="M 100 60 Q 120 80 100 100 Q 80 80 100 60" fill="#f97316"/>
        <path d="M 90 100 L 80 130 L 70 120 L 90 100" fill="#f59e0b"/>
        <path d="M 110 100 L 120 130 L 130 120 L 110 100" fill="#f59e0b"/>
        <circle cx="100" cy="140" r="30" fill="#dc2626"/>
      </svg>
    );
  }
  
  // Default - Generic celebration
  return (
    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="70" fill="none" stroke="#6366f1" strokeWidth="4"/>
      <path d="M 100 40 L 110 70 L 140 70 L 115 90 L 125 120 L 100 100 L 75 120 L 85 90 L 60 70 L 90 70 Z" fill="#6366f1"/>
    </svg>
  );
};

const PublicHolidayViewModal: React.FC<PublicHolidayViewModalProps> = ({
  isOpen,
  onClose,
  holiday
}) => {
  if (!isOpen) return null;

  const holidayDate = dayjs(holiday.day);
  const holidaySVG = getHolidaySVG(holiday.title);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header with contextual SVG background */}
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-8 border-b border-gray-200">
          {holidaySVG}
          
          <div className="relative z-10">
            <button
              onClick={onClose}
              className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 mb-1 leading-tight">
                  {holiday.title}
                </h2>
                <p className="text-sm text-gray-600">
                  {holidayDate.format('dddd, MMMM D, YYYY')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Description with icon (Google Calendar style) */}
          {holiday.description && (
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed flex-1">
                {holiday.description}
              </p>
            </div>
          )}

          {/* Public Holiday Info with icon */}
          <div className="flex items-start space-x-3">
            <Globe className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-0.5">Public holiday</p>
              <p className="text-xs text-gray-500">Official holiday for all users</p>
            </div>
          </div>

          {/* Calendar Info with icon */}
          <div className="flex items-start space-x-3">
            <CalendarIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-0.5">All day</p>
              <p className="text-xs text-gray-500">{holidayDate.format('dddd, MMMM D, YYYY')}</p>
            </div>
          </div>

          {/* Visibility with lock icon */}
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-0.5">Public</p>
              <p className="text-xs text-gray-500">Anyone can see all event details</p>
            </div>
          </div>

          {/* Admin notice - subtle like Google */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 leading-relaxed">
              This event is managed by administrators. Contact support for any changes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PublicHolidayViewModal;