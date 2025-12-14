// src/store/api/calendarApi.ts - FIXED PUBLIC HOLIDAY DATE PARSING
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import dayjs from 'dayjs';
import type { 
  CalendarEvent, 
  EventLabel,
  CreateEventInput,
  UpdateEventInput,
  DeleteEventInput,
  PublicHoliday,
  GetEventsParams,
  CalendarEventsResponse
} from '../../types/calendar.types';

// ============================================
// TRANSFORMATION HELPERS
// ============================================

/**
 * Transform backend event to frontend format
 * Key: Ensure `day` is always a Unix timestamp
 */
function transformBackendEvent(backendEvent: any): CalendarEvent {
  const startTime = dayjs(backendEvent.start_time);
  
  return {
    // IDs
    id: backendEvent.id,
    eventId: backendEvent.id,
    userId: backendEvent.user_id,
    
    // Core Details
    title: backendEvent.title,
    event: backendEvent.title,
    description: backendEvent.description,
    location: backendEvent.location,
    
    // Timing - CRITICAL FIX
    startTime: backendEvent.all_day 
      ? startTime.format('HH:mm')
      : startTime.format('HH:mm'),
    endTime: backendEvent.all_day
      ? dayjs(backendEvent.end_time).format('HH:mm')
      : dayjs(backendEvent.end_time).format('HH:mm'),
    day: startTime.valueOf(), // ✅ UNIX TIMESTAMP for filtering
    allDay: backendEvent.all_day,
    timezone: backendEvent.timezone,
    
    // Recurrence
    recurrenceType: backendEvent.recurrence_type || 'none',
    recurrence: {
      type: backendEvent.recurrence_type || 'none',
      config: backendEvent.recurrence_config
    },
    recurrenceConfig: backendEvent.recurrence_config,
    parentEventId: backendEvent.parent_event_id,
    isRecurringParent: backendEvent.is_recurring_parent,
    
    // Visual
    label: backendEvent.label as EventLabel,
    
    // Notifications
    notificationSettings: backendEvent.notification_settings || { type: 'Snooze', interval: null },
    notification: backendEvent.notification_settings || { type: 'Snooze', interval: null },
    
    // Guests
    guests: backendEvent.event_guests || backendEvent.guests || [],
    selectedGuest: backendEvent.event_guests || backendEvent.guests || [],
    
    // Status
    status: backendEvent.status || 'active',
    
    // Metadata
    createdAt: backendEvent.created_at,
    updatedAt: backendEvent.updated_at,
    deletedAt: backendEvent.deleted_at
  };
}

/**
 * ✅ FIXED: Transform public holiday to calendar event format
 * Now correctly reads holiday_date (snake_case) from backend
 */
function transformPublicHoliday(holiday: any): CalendarEvent {
  // ✅ CRITICAL FIX: Read holiday_date (snake_case) from backend response
  const holidayDate = dayjs(holiday.holiday_date || holiday.holidayDate);
  
  return {
    id: `holiday_${holiday.id}`,
    eventId: `holiday_${holiday.id}`,
    title: holiday.title,
    event: holiday.title,
    description: holiday.description || '',
    startTime: '00:00',
    endTime: '23:59',
    day: holidayDate.valueOf(), // ✅ CORRECT Unix timestamp now
    allDay: true,
    timezone: 'UTC',
    label: 'grey' as EventLabel,
    recurrence: { type: 'none' },
    guests: [],
    selectedGuest: [],
    notification: { type: 'Snooze', interval: null },
    notificationSettings: { type: 'Snooze', interval: null },
    isPublicHoliday: true,
    isEditable: false,
    status: 'active'
  };
}

// ============================================
// API SLICE - OPTIMIZED FOR SPEED
// ============================================

export const calendarApi = createApi({
  reducerPath: 'calendarApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/calendar`,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    }
  }),
  tagTypes: ['CalendarEvents', 'PublicHolidays'],
  keepUnusedDataFor: 180, // ⚡ 3 min cache - balance speed & freshness
  refetchOnMountOrArgChange: 30, // ⚡ Refetch if data is 30s+ old
  refetchOnFocus: true, // ✅ ALWAYS sync when returning to tab (catch partner updates)
  refetchOnReconnect: true, // ✅ Sync on internet reconnect
  
  endpoints: (builder) => ({
    
    // ============================================
    // GET EVENTS - OPTIMIZED
    // ============================================
    getEvents: builder.query<CalendarEventsResponse, GetEventsParams>({
      query: ({ startDate, endDate, includeRecurring = true }) => ({
        url: '/events',
        params: { startDate, endDate, includeRecurring }
      }),
      providesTags: ['CalendarEvents'],
      // ⚡ PERFORMANCE: Transform once, cache for 5 minutes
      transformResponse: (response: any): CalendarEventsResponse => {
        const transformedUserEvents = (response.data?.userEvents || []).map(transformBackendEvent);
        const transformedHolidays = (response.data?.publicHolidays || []).map(transformPublicHoliday);
        
        return {
          success: response.success,
          data: {
            userEvents: transformedUserEvents,
            publicHolidays: transformedHolidays
          },
          timestamp: response.timestamp
        };
      }
    }),

    // ============================================
    // CREATE EVENT - OPTIMISTIC UPDATE
    // ============================================
    createEvent: builder.mutation<CalendarEvent, CreateEventInput>({
      query: (data) => ({
        url: '/events',
        method: 'POST',
        body: data
      }),
      async onQueryStarted(newEvent, { dispatch, queryFulfilled }) {
        // ⚡ OPTIMISTIC: Show event immediately
        const patchResult = dispatch(
          calendarApi.util.updateQueryData('getEvents', {} as any, (draft) => {
            if (draft?.data?.userEvents) {
              const tempEvent = transformBackendEvent({
                id: `temp_${Date.now()}`,
                ...newEvent,
                start_time: newEvent.startTime,
                end_time: newEvent.endTime,
                all_day: newEvent.allDay,
                recurrence_type: newEvent.recurrence.type,
                recurrence_config: newEvent.recurrence.config,
                is_recurring_parent: newEvent.recurrence.type !== 'none',
                notification_settings: newEvent.notification,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
              draft.data.userEvents.push(tempEvent);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['CalendarEvents']
    }),

    // ============================================
    // UPDATE EVENT - OPTIMISTIC UPDATE
    // ============================================
    updateEvent: builder.mutation<CalendarEvent, UpdateEventInput>({
      query: ({ id, ...data }) => ({
        url: `/events/${id}`,
        method: 'PUT',
        body: data
      }),
      async onQueryStarted({ id, ...updates }, { dispatch, queryFulfilled }) {
        // ⚡ OPTIMISTIC: Update immediately
        const patchResult = dispatch(
          calendarApi.util.updateQueryData('getEvents', {} as any, (draft) => {
            if (draft?.data?.userEvents) {
              const eventIndex = draft.data.userEvents.findIndex(
                evt => evt.id === id || evt.eventId === id
              );
              
              if (eventIndex !== -1) {
                const currentEvent = draft.data.userEvents[eventIndex];
                draft.data.userEvents[eventIndex] = {
                  ...currentEvent,
                  ...updates,
                  title: updates.title || currentEvent.title,
                  event: updates.title || currentEvent.event,
                  updatedAt: new Date().toISOString()
                };
              }
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['CalendarEvents']
    }),

    // ============================================
    // DELETE EVENT - OPTIMISTIC UPDATE
    // ============================================
    deleteEvent: builder.mutation<void, DeleteEventInput>({
      query: ({ id, deleteType = 'single' }) => ({
        url: `/events/${id}`,
        method: 'DELETE',
        params: { deleteType }
      }),
      async onQueryStarted({ id, deleteType }, { dispatch, queryFulfilled }) {
        // ⚡ OPTIMISTIC: Remove immediately
        const patchResult = dispatch(
          calendarApi.util.updateQueryData('getEvents', {} as any, (draft) => {
            if (draft?.data?.userEvents) {
              if (deleteType === 'all') {
                draft.data.userEvents = draft.data.userEvents.filter(
                  evt => evt.id !== id && evt.eventId !== id && evt.parentEventId !== id
                );
              } else {
                draft.data.userEvents = draft.data.userEvents.filter(
                  evt => evt.id !== id && evt.eventId !== id
                );
              }
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['CalendarEvents']
    }),

    // ============================================
    // GET PUBLIC HOLIDAYS - LONG CACHE
    // ============================================
    getPublicHolidays: builder.query<PublicHoliday[], { year: number; country?: string }>({
      query: ({ year, country }) => ({
        url: '/public-holidays',
        params: { year, country }
      }),
      providesTags: ['PublicHolidays'],
      keepUnusedDataFor: 86400, // ⚡ 24 hour cache (holidays don't change often)
      transformResponse: (response: any) => response.data || []
    }),

    // ============================================
    // CREATE PUBLIC HOLIDAY (Admin)
    // ============================================
    createPublicHoliday: builder.mutation<PublicHoliday, Omit<PublicHoliday, 'id'>>({
      query: (data) => ({
        url: '/public-holidays',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['PublicHolidays', 'CalendarEvents'] // ⚡ Refresh both
    })
  })
});

export const {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useGetPublicHolidaysQuery,
  useCreatePublicHolidayMutation
} = calendarApi;