// Cereforge Calendar Utilities
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrAfter);

/**
 * Generate calendar month grid (6 weeks x 7 days)
 */
export const getMonth = (month: number = dayjs().month()): Dayjs[][] => {
  const year = dayjs().year();
  const firstDayOfMonth = dayjs(new Date(year, month, 1)).day();
  let currentMonthCount = 0 - firstDayOfMonth;

  const daysMatrix = new Array(6).fill([]).map(() => {
    return new Array(7).fill(null).map(() => {
      currentMonthCount++;
      return dayjs(new Date(year, month, currentMonthCount));
    });
  });

  return daysMatrix;
};

/**
 * Format time for display (12-hour format)
 */
export const formatTime = (time: string): string => {
  return dayjs(time, 'HH:mm').format('hh:mm A');
};

/**
 * Calculate event duration
 */
export const calculateDuration = (startTime: string, endTime: string): string => {
  const start = dayjs(startTime, 'HH:mm');
  const end = dayjs(endTime, 'HH:mm');
  const diff = end.diff(start, 'minute');
  
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
};

/**
 * Check if date is today
 */
export const isToday = (date: Dayjs): boolean => {
  return date.format('DD-MM-YY') === dayjs().format('DD-MM-YY');
};

/**
 * Check if date is in current month
 */
export const isCurrentMonth = (date: Dayjs, monthIndex: number): boolean => {
  return date.month() === monthIndex;
};

/**
 * Generate consultation time slots
 */
export const generateTimeSlots = (
  date: Date,
  startHour: number = 9,
  endHour: number = 17,
  intervalMinutes: number = 30
): string[] => {
  const slots: string[] = [];
  let currentTime = dayjs(date).hour(startHour).minute(0);
  const endTime = dayjs(date).hour(endHour).minute(0);

  while (currentTime.isBefore(endTime)) {
    slots.push(currentTime.format('HH:mm'));
    currentTime = currentTime.add(intervalMinutes, 'minute');
  }

  return slots;
};

/**
 * Format timezone display
 */
export const formatTimezone = (timezone: string): string => {
  try {
    const tzParts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'long'
    }).formatToParts(new Date());
    
    const tzName = tzParts.find(part => part.type === 'timeZoneName')?.value || timezone;
    const city = timezone.split('/')[1]?.replace('_', ' ') || '';
    
    return `${tzName} - ${city}`;
  } catch {
    return timezone;
  }
};

/**
 * Generate unique event ID
 */
export const generateEventId = (): string => {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sort events by time
 */
export const sortEventsByTime = (events: any[]): any[] => {
  return events.sort((a, b) => {
    const aTime = dayjs(a.startTime, 'hh:mm A');
    const bTime = dayjs(b.startTime, 'hh:mm A');
    return aTime.isBefore(bTime) ? -1 : 1;
  });
};

/**
 * Get events for specific date
 */
export const getEventsForDate = (events: any[], date: Dayjs): any[] => {
  return events.filter(
    evt => dayjs(evt.day).format('DD-MM-YY') === date.format('DD-MM-YY')
  );
};

/**
 * Check if time slot is available
 */
export const isTimeSlotAvailable = (
  date: Dayjs,
  timeSlot: string,
  existingEvents: any[]
): boolean => {
  const slotTime = dayjs(timeSlot, 'HH:mm');
  const dateEvents = getEventsForDate(existingEvents, date);
  
  return !dateEvents.some(event => {
    const eventStart = dayjs(event.startTime, 'hh:mm A');
    const eventEnd = dayjs(event.endTime, 'hh:mm A');
    return slotTime.isSameOrAfter(eventStart) && slotTime.isBefore(eventEnd);
  });
};

/**
 * Get week number of year
 */
export const getWeekNumber = (date: Dayjs): number => {
  const startOfYear = dayjs(date).startOf('year');
  const diff = date.diff(startOfYear, 'day');
  return Math.ceil((diff + startOfYear.day() + 1) / 7);
};

/**
 * Label color mapping
 */
export const labelColors: Record<string, string> = {
  indigo: '#6366f1',
  grey: '#6b7280',
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
  purple: '#a855f7'
};

/**
 * Get label color class for Tailwind
 */
export const getLabelColorClass = (label: string): string => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500 text-white',
    grey: 'bg-gray-500 text-white',
    green: 'bg-green-500 text-white',
    blue: 'bg-blue-500 text-white',
    red: 'bg-red-500 text-white',
    purple: 'bg-purple-500 text-white'
  };
  return colorMap[label] || 'bg-gray-500 text-white';
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format date for display
 */
export const formatDateDisplay = (date: Dayjs | Date, format: string = 'MMMM D, YYYY'): string => {
  return dayjs(date).format(format);
};

/**
 * Get available consultation dates (next 30 days, excluding weekends)
 */
export const getAvailableConsultationDates = (daysAhead: number = 30): Dayjs[] => {
  const dates: Dayjs[] = [];
  let currentDate = dayjs().add(1, 'day'); // Start from tomorrow
  
  while (dates.length < daysAhead) {
    // Exclude weekends (Saturday = 6, Sunday = 0)
    if (currentDate.day() !== 0 && currentDate.day() !== 6) {
      dates.push(currentDate);
    }
    currentDate = currentDate.add(1, 'day');
  }
  
  return dates;
};