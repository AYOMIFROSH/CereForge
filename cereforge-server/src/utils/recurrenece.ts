// src/utils/recurrence.ts
// =====================================================
// RECURRING EVENTS LOGIC
// Handles expansion of recurring events into instances
// =====================================================

import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrAfter);
import { CalendarEvent, RecurrenceConfig, RecurringEventInstance } from '../types/calendar.types';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Generate recurring event instances within a date range
 * @param parentEvent - The parent recurring event
 * @param rangeStart - Start of date range
 * @param rangeEnd - End of date range
 * @returns Array of event instances
 */
export function generateRecurringInstances(
    parentEvent: CalendarEvent,
    rangeStart: Date,
    rangeEnd: Date
): RecurringEventInstance[] {
    if (!parentEvent.is_recurring_parent || parentEvent.recurrence_type === 'none') {
        return [];
    }

    const instances: RecurringEventInstance[] = [];
    const config = parentEvent.recurrence_config as RecurrenceConfig;

    let currentDate = dayjs(parentEvent.start_time).utc();
    const endLimit = dayjs(rangeEnd).utc();
    const startLimit = dayjs(rangeStart).utc();

    let count = 0;
    const maxOccurrences = config.occurrences || 500; // Safety limit
    const maxIterations = 1000; // Prevent infinite loops

    // Calculate event duration
    const eventDuration = dayjs(parentEvent.end_time).diff(parentEvent.start_time, 'millisecond');

    while (
        currentDate.isBefore(endLimit) &&
        count < maxOccurrences &&
        count < maxIterations
    ) {
        // Check if instance falls within range
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

        // Calculate next occurrence
        currentDate = getNextOccurrence(currentDate, config);

        count++;

        // Check end conditions
        if (config.endType === 'on' && config.endDate) {
            if (currentDate.isAfter(dayjs(config.endDate).utc())) break;
        }

        if (config.endType === 'after' && count >= maxOccurrences) {
            break;
        }

    }

    return instances;
}

/**
 * Calculate next occurrence based on recurrence type
 */
function getNextOccurrence(current: Dayjs, config: RecurrenceConfig): Dayjs {
    const interval = config.interval || 1;

    switch (config.type) {
        case 'daily':
            return current.add(interval, 'day');

        case 'weekly':
            return current.add(interval, 'week');

        case 'monthly':
            return current.add(interval, 'month');

        case 'annually':
            return current.add(1, 'year');

        case 'weekdays':
            // Skip weekends
            let next = current.add(1, 'day');
            while (next.day() === 0 || next.day() === 6) {
                next = next.add(1, 'day');
            }
            return next;

        case 'custom':
            // Custom weekly recurrence (specific days of week)
            if (config.daysOfWeek && config.daysOfWeek.length > 0) {
                let next = current.add(1, 'day');
                let maxDays = 7; // Safety limit

                while (!config.daysOfWeek.includes(next.day()) && maxDays > 0) {
                    next = next.add(1, 'day');
                    maxDays--;
                }

                return next;
            }
            return current.add(interval, 'day');

        default:
            return current.add(1, 'day');
    }
}

/**
 * Check if a date should be excluded from recurrence
 * (for future implementation of exception dates)
 */
export function isRecurrenceException(
    date: Date,
    exceptions: Date[]
): boolean {
    const targetDate = dayjs(date).format('YYYY-MM-DD');
    return exceptions.some(ex => dayjs(ex).format('YYYY-MM-DD') === targetDate);
}

/**
 * Validate recurrence configuration
 */
export function validateRecurrenceConfig(config: RecurrenceConfig): boolean {
    if (config.type === 'none') return true;

    // Check interval
    if (config.interval !== undefined && config.interval < 1) {
        return false;
    }

    // Check end conditions
    if (config.endType === 'on' && !config.endDate) {
        return false;
    }

    if (config.endType === 'after' && (!config.occurrences || config.occurrences < 1)) {
        return false;
    }

    // Check custom days of week
    if (config.type === 'custom' && config.daysOfWeek) {
        if (config.daysOfWeek.length === 0) return false;
        if (config.daysOfWeek.some(day => day < 0 || day > 6)) return false;
    }

    return true;
}

/**
 * Get human-readable recurrence description
 */
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

    // Add end condition
    if (config.endType === 'on' && config.endDate) {
        desc += ` until ${dayjs(config.endDate).format('MMM D, YYYY')}`;
    } else if (config.endType === 'after' && config.occurrences) {
        desc += `, ${config.occurrences} times`;
    }

    return desc;
}