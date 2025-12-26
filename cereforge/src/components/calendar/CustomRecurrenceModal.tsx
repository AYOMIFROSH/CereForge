// src/components/calendar/CustomRecurrenceModal.tsx
import React, { useState } from 'react';
import { X,  ChevronDown, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';
import type { RecurrenceConfig } from '@/types/calendar.types';

interface CustomRecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recurrence: RecurrenceConfig) => void;
  initialRecurrence?: RecurrenceConfig | null;
  eventStartDate: Dayjs;
}

const CustomRecurrenceModal: React.FC<CustomRecurrenceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecurrence,
  eventStartDate
}) => {
  const [repeatEvery, setRepeatEvery] = useState<number>(
    initialRecurrence?.type === 'custom' ? initialRecurrence.config.interval : 1
  );

  const [repeatUnit, setRepeatUnit] = useState<'day' | 'week' | 'month' | 'year'>(
    initialRecurrence?.type === 'custom' ? initialRecurrence.config.repeatUnit : 'week'
  );

  const [repeatOn, setRepeatOn] = useState<number[]>(
    initialRecurrence?.type === 'custom' ? initialRecurrence.config.daysOfWeek : [eventStartDate.day()]
  );

  const [endType, setEndType] = useState<'never' | 'on' | 'after'>(
    initialRecurrence?.type === 'custom' ? initialRecurrence.config.endType : 'never'
  );

  const [endDate, setEndDate] = useState<string>(
    initialRecurrence?.type === 'custom' && initialRecurrence.config.endDate
      ? dayjs(initialRecurrence.config.endDate).format('YYYY-MM-DD')
      : dayjs().add(1, 'month').format('YYYY-MM-DD')
  );

  const [endOccurrences, setEndOccurrences] = useState<number>(
    initialRecurrence?.type === 'custom' && initialRecurrence.config.occurrences
      ? initialRecurrence.config.occurrences
      : 10
  );

  const weekDays = [
    { label: 'S', value: 0, full: 'Sunday' },
    { label: 'M', value: 1, full: 'Monday' },
    { label: 'T', value: 2, full: 'Tuesday' },
    { label: 'W', value: 3, full: 'Wednesday' },
    { label: 'T', value: 4, full: 'Thursday' },
    { label: 'F', value: 5, full: 'Friday' },
    { label: 'S', value: 6, full: 'Saturday' }
  ];

  const repeatUnits = [
    { value: 'day' as const, singular: 'day', plural: 'days' },
    { value: 'week' as const, singular: 'week', plural: 'weeks' },
    { value: 'month' as const, singular: 'month', plural: 'months' },
    { value: 'year' as const, singular: 'year', plural: 'years' }
  ];

  const toggleDayOfWeek = (day: number) => {
    setRepeatOn(prev => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== day);
      }
      return [...prev, day].sort();
    });
  };

  // Logic remains EXACTLY the same
  const generatePreview = (): string[] => {
    const previews: string[] = [];
    let currentDate = eventStartDate;
    let count = 0;
    const maxPreviews = 3; // Reduced preview count for compactness

    while (count < maxPreviews) {
      if (repeatUnit === 'week' && repeatOn.length > 0) {
        const daysToCheck = [...repeatOn].sort();
        for (const dayOfWeek of daysToCheck) {
          const nextDate = currentDate.day(dayOfWeek);
          if (nextDate.isAfter(eventStartDate) || nextDate.isSame(eventStartDate, 'day')) {
            if (count < maxPreviews) {
              previews.push(nextDate.format('ddd, MMM D, YYYY'));
              count++;
            }
          }
        }
        currentDate = currentDate.add(repeatEvery, 'week');
      } else {
        if (count === 0) {
          previews.push(currentDate.format('ddd, MMM D, YYYY'));
        } else {
          previews.push(currentDate.format('ddd, MMM D, YYYY'));
        }
        currentDate = currentDate.add(repeatEvery, repeatUnit);
        count++;
      }
    }

    return previews.slice(0, maxPreviews);
  };

  const generateLabel = (): string => {
    const unitLabel = repeatUnits.find(u => u.value === repeatUnit);
    const unitText = repeatEvery === 1 ? unitLabel?.singular : unitLabel?.plural;

    let label = `Every ${repeatEvery > 1 ? repeatEvery + ' ' : ''}${unitText}`;

    if (repeatUnit === 'week' && repeatOn.length > 0 && repeatOn.length < 7) {
      const dayNames = repeatOn.map(d => weekDays[d].label).join(', ');
      label += ` on ${dayNames}`;
    }

    if (endType === 'on') {
      label += `, until ${dayjs(endDate).format('MMM D, YYYY')}`;
    } else if (endType === 'after') {
      label += `, ${endOccurrences} times`;
    }

    return label;
  };

  const handleSave = () => {
    const recurrence: RecurrenceConfig = {
      type: 'custom',
      config: {
        type: 'custom',
        interval: repeatEvery,
        repeatUnit: repeatUnit,
        daysOfWeek: repeatUnit === 'week' ? repeatOn : [],
        endType: endType,
        endDate: endType === 'on' ? new Date(endDate) : null,
        occurrences: endType === 'after' ? endOccurrences : null
      }
    };
    onSave(recurrence);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        // CHANGED: Reduced max-width (max-w-md) and rounded corners (rounded-xl)
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
      >
        {/* Header - CLEANER */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Custom Recurrence
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - COMPACT */}
        <div className="p-5 space-y-5 overflow-y-auto">
          
          {/* Repeat Every Row */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Repeat every</span>
            <input
              type="number"
              min="1"
              max="999"
              value={repeatEvery}
              onChange={(e) => setRepeatEvery(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1.5 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium text-center outline-none"
            />
            <div className="relative flex-1">
              <select
                value={repeatUnit}
                onChange={(e) => setRepeatUnit(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white outline-none cursor-pointer appearance-none"
              >
                {repeatUnits.map(unit => (
                  <option key={unit.value} value={unit.value}>
                    {repeatEvery === 1 ? unit.singular : unit.plural}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Repeat On (Weekly) - COMPACT CIRCLES */}
          <AnimatePresence>
            {repeatUnit === 'week' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Repeat on
                </label>
                <div className="flex justify-between gap-1">
                  {weekDays.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDayOfWeek(day.value)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        repeatOn.includes(day.value)
                        ? 'bg-blue-600 text-white shadow-sm scale-105'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title={day.full}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                {repeatOn.length === 0 && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center">
                    <Info className="w-3 h-3 mr-1" />
                    Select at least one day
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ends Section - CLEAN LIST */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Ends
            </label>
            <div className="space-y-3 pl-1">
              {/* Never */}
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'never'}
                  onChange={() => setEndType('never')}
                  className="w-4 h-4 text-blue-600 focus:ring-offset-0 focus:ring-blue-500 cursor-pointer"
                />
                <span className={`ml-3 text-sm ${endType === 'never' ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                  Never
                </span>
              </label>

              {/* On Date */}
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'on'}
                  onChange={() => setEndType('on')}
                  className="w-4 h-4 text-blue-600 focus:ring-offset-0 focus:ring-blue-500 cursor-pointer"
                />
                <span className={`ml-3 text-sm mr-2 ${endType === 'on' ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                  On
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={endType !== 'on'}
                  min={eventStartDate.format('YYYY-MM-DD')}
                  className={`px-2 py-1 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-opacity ${endType !== 'on' ? 'opacity-50 pointer-events-none bg-gray-50' : ''}`}
                />
              </label>

              {/* After Occurrences */}
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'after'}
                  onChange={() => setEndType('after')}
                  className="w-4 h-4 text-blue-600 focus:ring-offset-0 focus:ring-blue-500 cursor-pointer"
                />
                <span className={`ml-3 text-sm mr-2 ${endType === 'after' ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                  After
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={endOccurrences}
                    onChange={(e) => setEndOccurrences(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={endType !== 'after'}
                    className={`w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center ${endType !== 'after' ? 'opacity-50 pointer-events-none bg-gray-50' : ''}`}
                  />
                  <span className="text-sm text-gray-500">occurrences</span>
                </div>
              </label>
            </div>
          </div>

          {/* Preview Footer - SUBTLE */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-sm text-gray-800 font-medium mb-1">{generateLabel()}</p>
            <p className="text-xs text-gray-500">
              Next: {generatePreview().join(', ')}...
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={repeatUnit === 'week' && repeatOn.length === 0}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomRecurrenceModal;