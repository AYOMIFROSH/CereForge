// src/hooks/useCalendarEvents.ts - FIXED UPDATE/DELETE
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

// ✅ HELPER: Extract parent ID from instance ID
const extractParentId = (eventId: string): string => {
  // If ID contains "_instance_", extract parent ID
  if (eventId.includes('_instance_')) {
    return eventId.split('_instance_')[0];
  }
  return eventId;
};

export const useCalendarEvents = ({ monthIndex, year }: UseCalendarEventsParams) => {
  const currentYear = year || dayjs().year();
  
  const dateRange = useMemo(() => {
    const firstDayOfMonth = dayjs().year(currentYear).month(monthIndex).startOf('month');
    const firstDayOfGrid = firstDayOfMonth.startOf('week');
    
    const lastDayOfMonth = dayjs().year(currentYear).month(monthIndex).endOf('month');
    const lastDayOfGrid = lastDayOfMonth.endOf('week');
    
    return {
      startDate: firstDayOfGrid.toISOString(),
      endDate: lastDayOfGrid.toISOString()
    };
  }, [currentYear, monthIndex]);

  const { 
    data: eventsData, 
    isLoading: eventsLoading, 
    error: eventsError,
    refetch: refetchEvents
  } = useGetEventsQuery({
    ...dateRange,
    includeRecurring: true
  });

  useGetPublicHolidaysQuery(
    { year: currentYear },
    { skip: false }
  );

  const [createEventMutation, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEventMutation, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [deleteEventMutation, { isLoading: isDeleting }] = useDeleteEventMutation();

  const [labels, setLabels] = useState<LabelFilter[]>([
    { label: 'indigo', checked: true },
    { label: 'grey', checked: true },
    { label: 'green', checked: true },
    { label: 'blue', checked: true },
    { label: 'red', checked: true },
    { label: 'purple', checked: true }
  ]);

  const filteredEvents = useMemo(() => {
    if (!eventsData?.data?.userEvents) {
      return [];
    }
    
    return eventsData.data.userEvents.filter(evt =>
      labels.find(lbl => lbl.label === evt.label && lbl.checked)
    );
  }, [eventsData?.data?.userEvents, labels]);

  const publicHolidays = useMemo((): CalendarEvent[] => {
    if (!eventsData?.data?.publicHolidays) return [];
    return eventsData.data.publicHolidays as any[];
  }, [eventsData?.data?.publicHolidays]);

  const allEvents = useMemo((): CalendarEvent[] => {
    return [...filteredEvents, ...publicHolidays];
  }, [filteredEvents, publicHolidays]);

  const updateLabel = useCallback((updated: LabelFilter) => {
    setLabels(prev => 
      prev.map(lbl => lbl.label === updated.label ? updated : lbl)
    );
  }, []);

// src/hooks/useCalendarEvents.ts - FIXED CUSTOM RECURRENCE
const addEvent = useCallback(async (event: CalendarEvent) => {
  try {
    console.log('➕ Creating event:', event);
    
    // ✅ FIXED: Properly extract custom recurrence config
    let recurrenceData: any;
    
    if (typeof event.recurrence === 'object') {
      if (event.recurrence.type === 'custom' && event.recurrence.config) {
        // ✅ CRITICAL FIX: Extract ALL custom config fields
        const customConfig = event.recurrence.config;
        
        recurrenceData = {
          type: 'custom',
          config: {
            type: 'custom',
            interval: customConfig.interval || customConfig.repeatEvery || 1,
            repeatUnit: customConfig.repeatUnit || 'day', // ✅ THIS WAS MISSING!
            daysOfWeek: customConfig.daysOfWeek || customConfig.repeatOn || [],
            endType: customConfig.endType || customConfig.end?.type || 'never',
            endDate: customConfig.endDate || customConfig.end?.date || null,
            occurrences: customConfig.occurrences || customConfig.end?.occurrences || null
          }
        };

        console.log('📅 Custom recurrence config being sent:', recurrenceData);
      } else {
        // ✅ Simple recurrence
        recurrenceData = {
          type: event.recurrence.type,
          config: undefined
        };
      }
    } else {
      // ✅ String recurrence type
      recurrenceData = {
        type: event.recurrence || 'none',
        config: undefined
      };
    }

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
      recurrence: recurrenceData, // ✅ Use properly structured recurrence
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

  // ✅ FIXED: Update event - extract parent ID
  const editEvent = useCallback(async (event: CalendarEvent) => {
    try {
      // ✅ Extract parent ID if this is an instance
      const parentId = extractParentId(event.id || event.eventId!);
      
      console.log('✏️ Updating event:', {
        originalId: event.id || event.eventId,
        parentId,
        isInstance: (event.id || event.eventId)?.includes('_instance_')
      });
      
      const backendEvent: UpdateEventInput = {
        id: parentId, // ✅ Use parent ID
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

  // ✅ FIXED: Delete event - extract parent ID
  const removeEvent = useCallback(async (
    eventId: string, 
    deleteType: 'single' | 'thisAndFuture' | 'all' = 'all' // ✅ Changed default to 'all'
  ) => {
    try {
      // ✅ Extract parent ID if this is an instance
      const parentId = extractParentId(eventId);
      
      console.log('🗑️ Deleting event:', {
        originalId: eventId,
        parentId,
        deleteType,
        isInstance: eventId.includes('_instance_')
      });
      
      await deleteEventMutation({ id: parentId, deleteType }).unwrap(); // ✅ Use parent ID
      console.log('✅ Event deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
      throw error;
    }
  }, [deleteEventMutation]);

  return {
    events: filteredEvents,
    publicHolidays,
    allEvents,
    loading: eventsLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error: eventsError,
    addEvent,
    updateEvent: editEvent,
    deleteEvent: removeEvent,
    refetchEvents,
    labels,
    updateLabel
  };
};

export default useCalendarEvents;