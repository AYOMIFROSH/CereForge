// src/components/calendar/CustomRecurrenceModal.tsx - FIXED TYPES
import React, { useState } from 'react';
import { X, Calendar, Repeat, ChevronDown, Info } from 'lucide-react';
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

  const generatePreview = (): string[] => {
    const previews: string[] = [];
    let currentDate = eventStartDate;
    let count = 0;
    const maxPreviews = 5;

    while (count < maxPreviews) {
      if (repeatUnit === 'week' && repeatOn.length > 0) {
        const daysToCheck = repeatOn.sort();
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
    // ✅ FIXED: Match exact type structure
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

    console.log('✅ CustomRecurrenceModal: Saving recurrence:', JSON.stringify(recurrence, null, 2));

    onSave(recurrence);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Repeat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Custom Recurrence</h2>
              <p className="text-blue-100 text-sm">Define your repeat pattern</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Repeat Every */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Repeat Every
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="1"
                max="999"
                value={repeatEvery}
                onChange={(e) => setRepeatEvery(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-center font-semibold text-lg"
              />
              <div className="relative flex-1">
                <select
                  value={repeatUnit}
                  onChange={(e) => setRepeatUnit(e.target.value as any)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none appearance-none bg-white font-medium cursor-pointer"
                >
                  {repeatUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {repeatEvery === 1 ? unit.singular : unit.plural}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Repeat On (for weekly) */}
          <AnimatePresence>
            {repeatUnit === 'week' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Repeat On
                </label>
                <div className="flex justify-between gap-2">
                  {weekDays.map((day) => (
                    <motion.button
                      key={day.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => toggleDayOfWeek(day.value)}
                      className={`flex-1 aspect-square rounded-xl font-bold text-sm transition-all ${repeatOn.includes(day.value)
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      title={day.full}
                    >
                      {day.label}
                    </motion.button>
                  ))}
                </div>
                {repeatOn.length === 0 && (
                  <p className="text-red-500 text-xs mt-2 flex items-center">
                    <Info className="w-3 h-3 mr-1" />
                    Select at least one day
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ends */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Ends
            </label>
            <div className="space-y-3">
              {/* Never */}
              <motion.label
                whileHover={{ x: 4 }}
                className={`flex items-center p-4 rounded-xl cursor-pointer transition-all ${endType === 'never'
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                  }`}
              >
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'never'}
                  onChange={() => setEndType('never')}
                  className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-3 font-medium text-gray-700">Never</span>
              </motion.label>

              {/* On Date */}
              <motion.label
                whileHover={{ x: 4 }}
                className={`flex items-center p-4 rounded-xl cursor-pointer transition-all ${endType === 'on'
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                  }`}
              >
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'on'}
                  onChange={() => setEndType('on')}
                  className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-3 font-medium text-gray-700 flex-1">On</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={endType !== 'on'}
                    min={eventStartDate.format('YYYY-MM-DD')}
                    className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </motion.label>

              {/* After N Occurrences */}
              <motion.label
                whileHover={{ x: 4 }}
                className={`flex items-center p-4 rounded-xl cursor-pointer transition-all ${endType === 'after'
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                  }`}
              >
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'after'}
                  onChange={() => setEndType('after')}
                  className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-3 font-medium text-gray-700 flex-1">After</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={endOccurrences}
                    onChange={(e) => setEndOccurrences(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={endType !== 'after'}
                    className="w-20 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-center font-semibold disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <span className="text-gray-600 font-medium">occurrences</span>
                </div>
              </motion.label>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
            <div className="flex items-center space-x-2 mb-3">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">Preview</h3>
            </div>
            <p className="text-sm text-gray-700 mb-3 font-medium">{generateLabel()}</p>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-600 uppercase">Next 5 occurrences:</p>
              {generatePreview().map((date, idx) => (
                <p key={idx} className="text-sm text-gray-700 pl-3">
                  • {date}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 font-semibold hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={repeatUnit === 'week' && repeatOn.length === 0}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Recurrence
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomRecurrenceModal;