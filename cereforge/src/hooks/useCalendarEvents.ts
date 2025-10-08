// useCalendarEvents.ts - Custom hook for managing calendar events
import { useState, useEffect, useCallback, useMemo } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent, LabelFilter } from '../types/calendar.types';

// Custom hook
export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, _setLoading] = useState(false);
  const [error, _setError] = useState<string | null>(null);

  // Label filters
  const [labels, setLabels] = useState<LabelFilter[]>([
    { label: 'indigo', checked: true },
    { label: 'grey', checked: true },
    { label: 'green', checked: true },
    { label: 'blue', checked: true },
    { label: 'red', checked: true },
    { label: 'purple', checked: true }
  ]);

  // Load events from localStorage on mount
  useEffect(() => {
    try {
      const savedEvents = localStorage.getItem('cereforge_calendar_events');
      if (savedEvents) {
        setEvents(JSON.parse(savedEvents));
      }
    } catch (err) {
      console.error('Failed to load events from localStorage:', err);
    }
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('cereforge_calendar_events', JSON.stringify(events));
    } catch (err) {
      console.error('Failed to save events to localStorage:', err);
    }
  }, [events]);

  // Add new event
  const addEvent = useCallback((event: CalendarEvent) => {
    setEvents(prev => [...prev, event]);
  }, []);

  // Update existing event
  const updateEvent = useCallback((updatedEvent: CalendarEvent) => {
    setEvents(prev =>
      prev.map(evt => evt.eventId === updatedEvent.eventId ? updatedEvent : evt)
    );
  }, []);

  // Delete single event
  const deleteEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(evt => evt.eventId !== eventId));
  }, []);

  // Delete recurring events
  const deleteRecurringEvents = useCallback((eventId: string) => {
    setEvents(prev =>
      prev.filter(evt => evt.eventId !== eventId && evt.parentId !== eventId)
    );
  }, []);

  // Get events for specific date
  const getEventsForDate = useCallback((date: Dayjs): CalendarEvent[] => {
    return events.filter(
      evt => dayjs(evt.day).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
    );
  }, [events]);

  // Get events for specific month
  const getEventsForMonth = useCallback((monthIndex: number, year: number = dayjs().year()): CalendarEvent[] => {
    return events.filter(evt => {
      const eventDate = dayjs(evt.day);
      return eventDate.month() === monthIndex && eventDate.year() === year;
    });
  }, [events]);

  // Get events for specific week
  const getEventsForWeek = useCallback((date: Dayjs): CalendarEvent[] => {
    const startOfWeek = date.startOf('week');
    const endOfWeek = date.endOf('week');
    
    return events.filter(evt => {
      const eventDate = dayjs(evt.day);
      return eventDate.isAfter(startOfWeek) && eventDate.isBefore(endOfWeek);
    });
  }, [events]);

  // Filter events by labels
  const filteredEvents = useMemo(() => {
    return events.filter(evt =>
      labels.find(lbl => lbl.label === evt.label && lbl.checked)
    );
  }, [events, labels]);

  // Update label filter
  const updateLabel = useCallback((updatedLabel: LabelFilter) => {
    setLabels(prev =>
      prev.map(lbl => lbl.label === updatedLabel.label ? updatedLabel : lbl)
    );
  }, []);

  // Search events
  const searchEvents = useCallback((query: string): CalendarEvent[] => {
    const lowerQuery = query.toLowerCase();
    return events.filter(evt =>
      evt.event.toLowerCase().includes(lowerQuery) ||
      evt.description.toLowerCase().includes(lowerQuery) ||
      evt.location.toLowerCase().includes(lowerQuery)
    );
  }, [events]);

  // Get upcoming events
  const getUpcomingEvents = useCallback((limit: number = 5): CalendarEvent[] => {
    const now = dayjs();
    return events
      .filter(evt => dayjs(evt.day).isAfter(now))
      .sort((a, b) => dayjs(a.day).diff(dayjs(b.day)))
      .slice(0, limit);
  }, [events]);

  // Get today's events
  const getTodaysEvents = useCallback((): CalendarEvent[] => {
    return getEventsForDate(dayjs());
  }, [getEventsForDate]);

  // Get event statistics
  const getEventStats = useCallback(() => {
    const today = dayjs();
    const thisWeek = events.filter(evt => {
      const eventDate = dayjs(evt.day);
      return eventDate.isSame(today, 'week');
    });
    const thisMonth = events.filter(evt => {
      const eventDate = dayjs(evt.day);
      return eventDate.isSame(today, 'month');
    });

    return {
      total: events.length,
      today: getTodaysEvents().length,
      thisWeek: thisWeek.length,
      thisMonth: thisMonth.length,
      upcoming: getUpcomingEvents().length
    };
  }, [events, getTodaysEvents, getUpcomingEvents]);

  // Clear all events
  const clearAllEvents = useCallback(() => {
    setEvents([]);
    localStorage.removeItem('cereforge_calendar_events');
  }, []);

  // Export events (for backup/download)
  const exportEvents = useCallback(() => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cereforge-calendar-events-${dayjs().format('YYYY-MM-DD')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [events]);

  // Import events (from backup/file)
  const importEvents = useCallback((importedEvents: CalendarEvent[]) => {
    setEvents(importedEvents);
  }, []);

  return {
    // State
    events,
    filteredEvents,
    loading,
    error,
    labels,

    // Event operations
    addEvent,
    updateEvent,
    deleteEvent,
    deleteRecurringEvents,

    // Queries
    getEventsForDate,
    getEventsForMonth,
    getEventsForWeek,
    searchEvents,
    getUpcomingEvents,
    getTodaysEvents,
    getEventStats,

    // Label operations
    updateLabel,

    // Utility
    clearAllEvents,
    exportEvents,
    importEvents
  };
};

export default useCalendarEvents;