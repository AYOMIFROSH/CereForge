// src/hooks/useCalendarEvents.ts - FIXED TYPES
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
import type { 
  CalendarEvent, 
  LabelFilter, 
  CreateEventInput, 
  UpdateEventInput,
  RecurrenceConfig 
} from '../types/calendar.types';

dayjs.extend(utc);
dayjs.extend(timezone);

interface UseCalendarEventsParams {
  monthIndex: number;
  year?: number;
}

// ✅ HELPER: Extract parent ID from instance ID
const extractParentId = (eventId: string): string => {
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

  // ✅ FIXED: Create event with proper type handling
  const addEvent = useCallback(async (event: CalendarEvent) => {
    try {
      console.log('➕ Creating event:', event);
      
      // ✅ FIXED: Properly structure recurrence based on type
      let recurrenceData: RecurrenceConfig;
      
      if (typeof event.recurrence === 'string') {
        // Simple recurrence type
        recurrenceData = {
          type: event.recurrence as any
        };
      } else if (event.recurrence && event.recurrence.type === 'custom') {
        // Custom recurrence with config
        recurrenceData = event.recurrence as RecurrenceConfig;
      } else {
        // Default to 'none'
        recurrenceData = {
          type: 'none'
        };
      }

      console.log('📅 Recurrence data being sent:', recurrenceData);

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
        recurrence: recurrenceData,
        label: event.label,
        guests: event.selectedGuest || event.guests || [],
        sendInvitations: (event as any).sendInvitations || false,
        notification: event.notification || event.notificationSettings || { 
          type: 'Snooze', 
          interval: null 
        }
      };

      console.log('📤 Sending to API:', backendEvent);
      await createEventMutation(backendEvent).unwrap();
      console.log('✅ Event created successfully');
    } catch (error) {
      console.error('❌ Failed to create event:', error);
      throw error;
    }
  }, [createEventMutation]);

  // ✅ FIXED: Update event with proper type handling
  const editEvent = useCallback(async (event: CalendarEvent) => {
    try {
      const parentId = extractParentId(event.id || event.eventId!);
      
      console.log('✏️ Updating event:', {
        originalId: event.id || event.eventId,
        parentId,
        isInstance: (event.id || event.eventId)?.includes('_instance_')
      });

      // ✅ FIXED: Properly structure recurrence
      let recurrenceData: RecurrenceConfig;
      
      if (typeof event.recurrence === 'string') {
        recurrenceData = {
          type: event.recurrence as any
        };
      } else if (event.recurrence && event.recurrence.type === 'custom') {
        recurrenceData = event.recurrence as RecurrenceConfig;
      } else {
        recurrenceData = {
          type: 'none'
        };
      }
      
      const backendEvent: UpdateEventInput = {
        id: parentId,
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
        recurrence: recurrenceData,
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

  // ✅ Delete event - extract parent ID
  const removeEvent = useCallback(async (
    eventId: string, 
    deleteType: 'single' | 'thisAndFuture' | 'all' = 'all'
  ) => {
    try {
      const parentId = extractParentId(eventId);
      
      console.log('🗑️ Deleting event:', {
        originalId: eventId,
        parentId,
        deleteType,
        isInstance: eventId.includes('_instance_')
      });
      
      await deleteEventMutation({ id: parentId, deleteType }).unwrap();
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