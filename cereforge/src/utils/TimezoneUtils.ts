// src/utils/TimezoneUtils.ts

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { value: 'Africa/Lagos', label: 'West Africa Time (WAT)', offset: '+01:00' },
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00' },
  { value: 'Europe/London', label: 'British Time (GMT)', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: '+01:00' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)', offset: '+01:00' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', offset: '+04:00' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', offset: '+05:30' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: '+09:00' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', offset: '+10:00' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time (NZST)', offset: '+12:00' },
];

/**
 * Get user's browser timezone
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Get timezone display with label and offset
 */
export const getTimezoneDisplay = (timezone: string): string => {
  const tz = COMMON_TIMEZONES.find(t => t.value === timezone);
  if (tz) return `${tz.label} ${tz.offset}`;
  return timezone;
};

/**
 * Filter timezones by search query
 */
export const filterTimezones = (search: string): TimezoneOption[] => {
  const query = search.toLowerCase();
  return COMMON_TIMEZONES.filter(tz =>
    tz.label.toLowerCase().includes(query) ||
    tz.value.toLowerCase().includes(query)
  );
};

/**
 * Get timezone offset string
 */
export const getTimezoneOffset = (timezone: string): string => {
  const tz = COMMON_TIMEZONES.find(t => t.value === timezone);
  return tz?.offset || '+00:00';
};

/**
 * Validate if timezone exists in our list
 */
export const isValidTimezone = (timezone: string): boolean => {
  return COMMON_TIMEZONES.some(tz => tz.value === timezone);
};