// src/hooks/useCalendarEvents.ts - FIXED RECURRENCE DATA FLOW
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

  // ✅ FIXED: Preserve full recurrence config
  const addEvent = useCallback(async (event: CalendarEvent) => {
    try {
      console.log('➕ Creating event with recurrence:', event.recurrence);
      
      // ✅ FIXED: Send recurrence exactly as received
      let recurrenceData: any;
      
      if (!event.recurrence || event.recurrence === 'none') {
        // No recurrence
        recurrenceData = { type: 'none' };
      } else if (typeof event.recurrence === 'string') {
        // Simple recurrence (daily, weekly, etc.)
        recurrenceData = { type: event.recurrence };
      } else if (typeof event.recurrence === 'object' && event.recurrence.type === 'custom') {
        // ✅ Custom recurrence - send the FULL object with config
        recurrenceData = {
          type: 'custom',
          config: {
            type: 'custom',
            interval: event.recurrence.config.interval,
            repeatUnit: event.recurrence.config.repeatUnit,
            daysOfWeek: event.recurrence.config.daysOfWeek,
            endType: event.recurrence.config.endType,
            endDate: event.recurrence.config.endDate ? 
              dayjs(event.recurrence.config.endDate).format('YYYY-MM-DD') : null,
            occurrences: event.recurrence.config.occurrences
          }
        };
      } else {
        // Fallback
        recurrenceData = { type: 'none' };
      }

      console.log('📅 Final recurrence being sent:', JSON.stringify(recurrenceData, null, 2));

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
        recurrence: recurrenceData as RecurrenceConfig,
        label: event.label,
        guests: event.selectedGuest || event.guests || [],
        sendInvitations: (event as any).sendInvitations || false,
        notification: event.notification || event.notificationSettings || { 
          type: 'Snooze', 
          interval: null 
        }
      };

      console.log('📤 Full payload to API:', JSON.stringify(backendEvent, null, 2));
      await createEventMutation(backendEvent).unwrap();
      console.log('✅ Event created successfully');
    } catch (error) {
      console.error('❌ Failed to create event:', error);
      throw error;
    }
  }, [createEventMutation]);

  // ✅ FIXED: Preserve full recurrence config in updates
  const editEvent = useCallback(async (event: CalendarEvent) => {
    try {
      const parentId = extractParentId(event.id || event.eventId!);
      
      console.log('✏️ Updating event with recurrence:', event.recurrence);

      // ✅ FIXED: Same logic as addEvent
      let recurrenceData: any;
      
      if (!event.recurrence || event.recurrence === 'none') {
        recurrenceData = { type: 'none' };
      } else if (typeof event.recurrence === 'string') {
        recurrenceData = { type: event.recurrence };
      } else if (typeof event.recurrence === 'object' && event.recurrence.type === 'custom') {
        recurrenceData = {
          type: 'custom',
          config: {
            type: 'custom',
            interval: event.recurrence.config.interval,
            repeatUnit: event.recurrence.config.repeatUnit,
            daysOfWeek: event.recurrence.config.daysOfWeek,
            endType: event.recurrence.config.endType,
            endDate: event.recurrence.config.endDate ? 
              dayjs(event.recurrence.config.endDate).format('YYYY-MM-DD') : null,
            occurrences: event.recurrence.config.occurrences
          }
        };
      } else {
        recurrenceData = { type: 'none' };
      }

      console.log('📅 Final recurrence being sent:', JSON.stringify(recurrenceData, null, 2));
      
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
        recurrence: recurrenceData as RecurrenceConfig,
        label: event.label,
        guests: event.selectedGuest || event.guests,
        notification: event.notification || event.notificationSettings
      };

      console.log('📤 Full update payload:', JSON.stringify(backendEvent, null, 2));
      await updateEventMutation(backendEvent).unwrap();
      console.log('✅ Event updated successfully');
    } catch (error) {
      console.error('❌ Failed to update event:', error);
      throw error;
    }
  }, [updateEventMutation]);

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