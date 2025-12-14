// src/hooks/useCalendarEvents.ts - FIXED
import { useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { 
  useGetEventsQuery, 
  useCreateEventMutation, 
  useUpdateEventMutation, 
  useDeleteEventMutation,
  useGetPublicHolidaysQuery 
} from '../store/api/calendarApi';
import type { CalendarEvent, LabelFilter, CreateEventInput, UpdateEventInput } from '../types/calendar.types';

dayjs.extend(utc);
dayjs.extend(timezone);

interface UseCalendarEventsParams {
  monthIndex: number;
  year?: number;
}

export const useCalendarEvents = ({ monthIndex, year }: UseCalendarEventsParams) => {
  const currentYear = year || dayjs().year();
  
  // ✅ Calculate date range for current month
  // ✅ Add 7-day buffer for smoother navigation
const dateRange = useMemo(() => {
  // ✅ Calculate the FULL visible calendar grid (6 weeks = 42 days)
  const firstDayOfMonth = dayjs().year(currentYear).month(monthIndex).startOf('month');
  const firstDayOfGrid = firstDayOfMonth.startOf('week'); // Sunday of first week
  
  const lastDayOfMonth = dayjs().year(currentYear).month(monthIndex).endOf('month');
  const lastDayOfGrid = lastDayOfMonth.endOf('week'); // Saturday of last week
  
  return {
    startDate: firstDayOfGrid.toISOString(),
    endDate: lastDayOfGrid.toISOString()
  };
}, [currentYear, monthIndex]);

  console.log('📅 Fetching events for range:', dateRange);

  // ✅ Fetch events from server
  const { 
    data: eventsData, 
    isLoading: eventsLoading, 
    error: eventsError,
    refetch: refetchEvents
  } = useGetEventsQuery({
    ...dateRange,
    includeRecurring: true
  });

  // ✅ Fetch public holidays (cached for 24h)
  useGetPublicHolidaysQuery(
    { year: currentYear },
    { skip: false }
  );

  // ✅ Mutations
  const [createEventMutation, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEventMutation, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [deleteEventMutation, { isLoading: isDeleting }] = useDeleteEventMutation();

  // ✅ Label filters (in-memory only)
  const [labels, setLabels] = useState<LabelFilter[]>([
    { label: 'indigo', checked: true },
    { label: 'grey', checked: true },
    { label: 'green', checked: true },
    { label: 'blue', checked: true },
    { label: 'red', checked: true },
    { label: 'purple', checked: true }
  ]);

  // ✅ Filter events by label
  const filteredEvents = useMemo(() => {
    if (!eventsData?.data?.userEvents) {
      console.log('⚠️ No events data available');
      return [];
    }
    
    const filtered = eventsData.data.userEvents.filter(evt =>
      labels.find(lbl => lbl.label === evt.label && lbl.checked)
    );
    
    console.log('✅ Filtered Events:', filtered.length, 'from', eventsData.data.userEvents.length);
    return filtered;
  }, [eventsData?.data?.userEvents, labels]);

  // ✅ Public holidays as calendar events (already transformed in API)
  const publicHolidays = useMemo((): CalendarEvent[] => {
    if (!eventsData?.data?.publicHolidays) return [];
    
    // Holidays are already transformed in calendarApi
    return eventsData.data.publicHolidays as any[];
  }, [eventsData?.data?.publicHolidays]);

  // ✅ All events combined
  const allEvents = useMemo((): CalendarEvent[] => {
    const combined = [...filteredEvents, ...publicHolidays];
    console.log('🎯 All Events (filtered + holidays):', combined.length);
    return combined;
  }, [filteredEvents, publicHolidays]);

  // ✅ Update label filter
  const updateLabel = useCallback((updated: LabelFilter) => {
    setLabels(prev => 
      prev.map(lbl => lbl.label === updated.label ? updated : lbl)
    );
  }, []);

  // ✅ Create event wrapper
  const addEvent = useCallback(async (event: CalendarEvent) => {
    try {
      console.log('➕ Creating event:', event);
      
      const backendEvent: CreateEventInput = {
        title: event.event || event.title,
        description: event.description || '',
        location: event.location || '',
        startTime: event.allDay 
          ? dayjs(event.day).startOf('day').toISOString()
          : dayjs(event.day)
              .hour(parseInt(event.startTime.split(':')[0]))
              .minute(parseInt(event.startTime.split(':')[1]))
              .toISOString(),
        endTime: event.allDay
          ? dayjs(event.day).endOf('day').toISOString()
          : dayjs(event.day)
              .hour(parseInt(event.endTime.split(':')[0]))
              .minute(parseInt(event.endTime.split(':')[1]))
              .toISOString(),
        allDay: event.allDay,
        timezone: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        recurrence: {
          type: typeof event.recurrence === 'object' ? event.recurrence.type : event.recurrence || 'none',
          config: typeof event.recurrence === 'object' && event.recurrence.type === 'custom' 
            ? event.recurrence 
            : undefined
        },
        label: event.label,
        guests: event.selectedGuest || event.guests || [],
        sendInvitations: false,
        notification: event.notification || event.notificationSettings || { type: 'Snooze', interval: null }
      };

      console.log('📤 Sending to API:', backendEvent);
      await createEventMutation(backendEvent).unwrap();
      console.log('✅ Event created successfully');
    } catch (error) {
      console.error('❌ Failed to create event:', error);
      throw error;
    }
  }, [createEventMutation]);

  // ✅ Update event wrapper
  const editEvent = useCallback(async (event: CalendarEvent) => {
    try {
      console.log('✏️ Updating event:', event);
      
      const backendEvent: UpdateEventInput = {
        id: event.id || event.eventId!,
        title: event.event || event.title,
        description: event.description,
        location: event.location,
        startTime: event.allDay 
          ? dayjs(event.day).startOf('day').toISOString()
          : dayjs(event.day)
              .hour(parseInt(event.startTime.split(':')[0]))
              .minute(parseInt(event.startTime.split(':')[1]))
              .toISOString(),
        endTime: event.allDay
          ? dayjs(event.day).endOf('day').toISOString()
          : dayjs(event.day)
              .hour(parseInt(event.endTime.split(':')[0]))
              .minute(parseInt(event.endTime.split(':')[1]))
              .toISOString(),
        allDay: event.allDay,
        timezone: event.timezone,
        recurrence: {
          type: typeof event.recurrence === 'object' ? event.recurrence.type : event.recurrence || 'none',
          config: typeof event.recurrence === 'object' && event.recurrence.type === 'custom' 
            ? event.recurrence 
            : undefined
        },
        label: event.label,
        guests: event.selectedGuest || event.guests,
        notification: event.notification || event.notificationSettings
      };

      await updateEventMutation(backendEvent).unwrap();
      console.log('✅ Event updated successfully');
    } catch (error) {
      console.error('❌ Failed to update event:', error);
      throw error;
    }
  }, [updateEventMutation]);

  // ✅ Delete event wrapper
  const removeEvent = useCallback(async (
    eventId: string, 
    deleteType: 'single' | 'thisAndFuture' | 'all' = 'single'
  ) => {
    try {
      console.log('🗑️ Deleting event:', eventId, 'type:', deleteType);
      await deleteEventMutation({ id: eventId, deleteType }).unwrap();
      console.log('✅ Event deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
      throw error;
    }
  }, [deleteEventMutation]);

  return {
    // Data
    events: filteredEvents,
    publicHolidays,
    allEvents,
    
    // Loading states
    loading: eventsLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error
    error: eventsError,
    
    // Actions
    addEvent,
    updateEvent: editEvent,
    deleteEvent: removeEvent,
    refetchEvents,
    
    // Filters
    labels,
    updateLabel
  };
};

export default useCalendarEvents;