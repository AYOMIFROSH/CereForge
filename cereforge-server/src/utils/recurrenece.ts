// src/utils/recurrence.ts - FIXED OCCURRENCE LIMITS
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrAfter);
dayjs.extend(utc);
dayjs.extend(timezone);

import { CalendarEvent, RecurrenceConfig, RecurringEventInstance } from '../types/calendar.types';

/**
 * ✅ FIXED: Generate recurring event instances within a date range
 * Now properly respects occurrence limits and end dates
 */
// REPLACE the generateRecurringInstances function in recurrenece.ts with this:

export function generateRecurringInstances(
  parentEvent: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): RecurringEventInstance[] {
  if (!parentEvent.is_recurring_parent || parentEvent.recurrence_type === 'none') {
    return [];
  }

  console.log('🔄 Generating recurring instances for event:', parentEvent.id);
  console.log('🔄 Recurrence config from DB:', JSON.stringify(parentEvent.recurrence_config, null, 2));

  const instances: RecurringEventInstance[] = [];
  const config = parentEvent.recurrence_config;

  // ✅ SAFETY CHECK: If config is null or invalid, return empty array
  if (!config || typeof config !== 'object') {
    console.warn('⚠️ Invalid recurrence_config, skipping instance generation');
    return [];
  }

  // ✅ Extract values with fallbacks
  const configType = config.type || parentEvent.recurrence_type || 'daily';
  const maxOccurrences = config.occurrences || 500;
  const maxIterations = 1000;
  const interval = config.interval || 1;
  const endType = config.endType || 'never';
  const repeatUnit = config.repeatUnit || 'day';
  const daysOfWeek = config.daysOfWeek || [];

  console.log('✅ Parsed config:', {
    type: configType,
    interval,
    repeatUnit,
    maxOccurrences,
    endType,
    daysOfWeek
  });

  let currentDate = dayjs(parentEvent.start_time).utc();
  const endLimit = dayjs(rangeEnd).utc();
  const startLimit = dayjs(rangeStart).utc();

  // ✅ Check end date limit
  let endDateLimit: Dayjs | null = null;
  if (endType === 'on' && config.endDate) {
    endDateLimit = dayjs(config.endDate).utc();
  }

  const eventDuration = dayjs(parentEvent.end_time).diff(parentEvent.start_time, 'millisecond');

  let count = 0;
  let iterationCount = 0;

  while (iterationCount < maxIterations) {
    iterationCount++;

    // ✅ Stop if we've hit occurrence limit
    if (endType === 'after' && count >= maxOccurrences) {
      console.log(`✅ Stopped at occurrence limit: ${maxOccurrences}`);
      break;
    }

    // ✅ Stop if we've hit end date limit
    if (endDateLimit && currentDate.isAfter(endDateLimit)) {
      console.log(`✅ Stopped at end date: ${endDateLimit.format('YYYY-MM-DD')}`);
      break;
    }

    // ✅ Stop if we've passed the range end
    if (currentDate.isAfter(endLimit)) {
      break;
    }

    // ✅ Add instance if within range
    if (currentDate.isSameOrAfter(startLimit) && currentDate.isBefore(endLimit)) {
      instances.push({
        ...parentEvent,
        id: `${parentEvent.id}_instance_${count}`,
        parent_event_id: parentEvent.id,
        start_time: currentDate.toISOString(),
        end_time: currentDate.add(eventDuration, 'millisecond').toISOString(),
        is_recurring_parent: false,
        isInstance: true,
        instanceDate: currentDate.toISOString(),
        instanceIndex: count
      });
    }

    count++;

    // ✅ Calculate next occurrence - pass the full config object
    currentDate = getNextOccurrence(currentDate, {
      type: configType,
      interval,
      repeatUnit,
      daysOfWeek,
      endType,
      endDate: config.endDate,
      occurrences: config.occurrences
    } as any);
  }

  console.log(`✅ Generated ${instances.length} instances (total count: ${count}, iterations: ${iterationCount})`);
  return instances;
}

/**
 * ✅ Calculate next occurrence based on recurrence type
 */
function getNextOccurrence(current: Dayjs, config: any): Dayjs {
  const interval = config.interval || 1;
  const type = config.type || 'daily';

  switch (type) {
    case 'daily':
      return current.add(interval, 'day');

    case 'weekly':
      return current.add(interval, 'week');

    case 'monthly':
      return current.add(interval, 'month');

    case 'annually':
      return current.add(1, 'year');

    case 'weekdays': {
      let next = current.add(1, 'day');
      while (next.day() === 0 || next.day() === 6) {
        next = next.add(1, 'day');
      }
      return next;
    }

    case 'custom': {
      const repeatUnit = config.repeatUnit || 'day';
      const daysOfWeek = config.daysOfWeek || [];
      
      // If it's weekly custom with specific days
      if (repeatUnit === 'week' && daysOfWeek.length > 0) {
        let next = current.add(1, 'day');
        let maxDays = 7;

        while (!daysOfWeek.includes(next.day()) && maxDays > 0) {
          next = next.add(1, 'day');
          maxDays--;
        }

        return next;
      }
      
      // ✅ For day/month/year custom intervals
      switch (repeatUnit) {
        case 'day':
          return current.add(interval, 'day');
        case 'week':
          return current.add(interval, 'week');
        case 'month':
          return current.add(interval, 'month');
        case 'year':
          return current.add(interval, 'year');
        default:
          return current.add(interval, 'day');
      }
    }

    default:
      return current.add(1, 'day');
  }
}

export function isRecurrenceException(
  date: Date,
  exceptions: Date[]
): boolean {
  const targetDate = dayjs(date).format('YYYY-MM-DD');
  return exceptions.some(ex => dayjs(ex).format('YYYY-MM-DD') === targetDate);
}

export function validateRecurrenceConfig(config: RecurrenceConfig): boolean {
  if (config.type === 'none') return true;

  if (config.interval !== undefined && config.interval < 1) {
    return false;
  }

  if (config.endType === 'on' && !config.endDate) {
    return false;
  }

  if (config.endType === 'after' && (!config.occurrences || config.occurrences < 1)) {
    return false;
  }

  if (config.type === 'custom' && config.daysOfWeek) {
    if (config.daysOfWeek.length === 0) return false;
    if (config.daysOfWeek.some(day => day < 0 || day > 6)) return false;
  }

  return true;
}

export function getRecurrenceDescription(config: RecurrenceConfig): string {
  if (config.type === 'none') return 'Does not repeat';

  const interval = config.interval || 1;
  let desc = '';

  switch (config.type) {
    case 'daily':
      desc = interval === 1 ? 'Daily' : `Every ${interval} days`;
      break;
    case 'weekly':
      desc = interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      break;
    case 'monthly':
      desc = interval === 1 ? 'Monthly' : `Every ${interval} months`;
      break;
    case 'annually':
      desc = 'Annually';
      break;
    case 'weekdays':
      desc = 'Every weekday (Monday to Friday)';
      break;
    case 'custom':
      if (config.daysOfWeek && config.daysOfWeek.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = config.daysOfWeek.map(d => dayNames[d]).join(', ');
        desc = `Weekly on ${days}`;
      } else {
        desc = 'Custom';
      }
      break;
  }

  if (config.endType === 'on' && config.endDate) {
    desc += ` until ${dayjs(config.endDate).format('MMM D, YYYY')}`;
  } else if (config.endType === 'after' && config.occurrences) {
    desc += `, ${config.occurrences} times`;
  }

  return desc;
}