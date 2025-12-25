// pages/CalendarPage.tsx - WITH PUBLIC HOLIDAY MODAL ROUTING
import { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import CalendarHeader from '../../components/calendar/CalendarHeader';
import CalendarSidebar from '../../components/calendar/CalendarSidebar';
import CalendarGrid from '../../components/calendar/CalendarGrid';
import CalendarDayView from '../../components/calendar/CalendarDayView';
import CalendarWeekView from '../../components/calendar/CalendarWeekView';
import CalendarYearView from '../../components/calendar/CalendarYearView';
import MobileCalendarView from '../../components/calendar/MobileCalendarView';
import EventModal from '../../components/calendar/EventModal';
import PublicHolidayViewModal from '../../components/calendar/modals/PublicHolidayModal'; // ✅ IMPORT
import CalendarLoadingToast from '../../components/calendar/modals/CalendarLoadingToats';
import type { CalendarEvent } from '../../types/calendar.types';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAppDispatch } from '@/store/hook';
import { addToast } from '@/store/slices/uiSlice';

type CalendarView = 'day' | 'week' | 'month' | 'year';

const CalendarPage = () => {
  useDocumentTitle(
    "Cereforge - Calendar",
    "Calendar - Manage your events and schedules at Cereforge",
    "/calendar"
  );

  const dispatch = useAppDispatch();

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);

  // Calendar state
  const [monthIndex, setMonthIndex] = useState(dayjs().month());
  const [yearIndex] = useState(dayjs().year());
  const [daySelected, setDaySelected] = useState<Dayjs>(dayjs());
  const [smallCalendarMonth, setSmallCalendarMonth] = useState<number | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false); // ✅ NEW STATE
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentView, setCurrentView] = useState<CalendarView>('month');

  // Server-connected hook
  const {
    allEvents,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    isCreating,
    isUpdating,
    isDeleting,
    labels,
    updateLabel
  } = useCalendarEvents({
    monthIndex,
    year: yearIndex
  });

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync small calendar with main calendar
  useEffect(() => {
    if (smallCalendarMonth !== null) {
      setMonthIndex(smallCalendarMonth);
    }
  }, [smallCalendarMonth]);

  // Show error toast if API fails
  useEffect(() => {
    if (error) {
      dispatch(addToast({
        message: 'Failed to load calendar events. Please try again.',
        type: 'error'
      }));
    }
  }, [error, dispatch]);

  // Calculate week start for week view
  const weekStart = daySelected.startOf('week');

  // Handlers
  const handleDayClick = (day: Dayjs) => {
    setDaySelected(day);
    setSelectedEvent(null);
    setShowEventModal(true);
    setShowHolidayModal(false); // ✅ ENSURE HOLIDAY MODAL CLOSED
  };

  // ✅ FIXED: Smart event click routing
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDaySelected(dayjs(event.day));

    // ✅ Route to correct modal based on event type
    if (event.isPublicHoliday) {
      setShowHolidayModal(true);
      setShowEventModal(false);
    } else {
      setShowEventModal(true);
      setShowHolidayModal(false);
    }
  };

  const handleSaveEvent = async (event: CalendarEvent) => {
    try {
      if (selectedEvent) {
        await updateEvent(event);
        dispatch(addToast({
          message: 'Event updated successfully!',
          type: 'success'
        }));
      } else {
        await addEvent(event);
        dispatch(addToast({
          message: 'Event created successfully!',
          type: 'success'
        }));
      }
      setShowEventModal(false);
      setSelectedEvent(null);
    } catch (error) {
      dispatch(addToast({
        message: 'Failed to save event. Please try again.',
        type: 'error'
      }));
    }
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setShowEventModal(true);
    setShowHolidayModal(false); // ✅ ENSURE HOLIDAY MODAL CLOSED
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      dispatch(addToast({
        message: 'Event deleted successfully!',
        type: 'success'
      }));
      setShowEventModal(false);
      setSelectedEvent(null);
    } catch (error) {
      dispatch(addToast({
        message: 'Failed to delete event. Please try again.',
        type: 'error'
      }));
    }
  };

  const handleTimeSlotClick = (time: string) => {
    const selectedTime = daySelected.hour(parseInt(time.split(':')[0])).minute(0);
    setDaySelected(selectedTime);
    setSelectedEvent(null);
    setShowEventModal(true);
    setShowHolidayModal(false); // ✅ ENSURE HOLIDAY MODAL CLOSED
  };

  const handleMonthClick = (monthIdx: number) => {
    setMonthIndex(monthIdx);
    setCurrentView('month');
  };

  // ✅ UNIFIED MODAL CLOSE HANDLER
  const handleCloseModals = () => {
    setShowEventModal(false);
    setShowHolidayModal(false);
    setSelectedEvent(null);
  };

  // Render current view (Desktop only)
  const renderView = () => {
    switch (currentView) {
      case 'day':
        return (
          <CalendarDayView
            daySelected={daySelected}
            filteredEvents={allEvents}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
          />
        );

      case 'week':
        return (
          <CalendarWeekView
            weekStart={weekStart}
            filteredEvents={allEvents}
            onEventClick={handleEventClick}
            onDayClick={handleDayClick}
          />
        );

      case 'year':
        return (
          <CalendarYearView
            year={yearIndex}
            filteredEvents={allEvents}
            onDayClick={handleDayClick}
            onMonthClick={handleMonthClick}
          />
        );

      case 'month':
      default:
        return (
          <CalendarGrid
            monthIndex={monthIndex}
            filteredEvents={allEvents}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        );
    }
  };

  // Mobile View
  if (isMobile) {
    return (
      <>
        <MobileCalendarView
          events={allEvents}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
          onCreateEvent={handleCreateEvent}
          daySelected={daySelected}
        />

        {/* ✅ Event Modal */}
        {showEventModal && selectedEvent && !selectedEvent.isPublicHoliday && (
          <EventModal
            isOpen={showEventModal}
            onClose={handleCloseModals}
            daySelected={daySelected}
            selectedEvent={selectedEvent}
            onSave={handleSaveEvent}
            onDelete={handleDeleteEvent}
          />
        )}

        {/* ✅ Create Event Modal */}
        {showEventModal && !selectedEvent && (
          <EventModal
            isOpen={showEventModal}
            onClose={handleCloseModals}
            daySelected={daySelected}
            selectedEvent={null}
            onSave={handleSaveEvent}
            onDelete={handleDeleteEvent}
          />
        )}

        {/* ✅ Public Holiday Modal */}
        {showHolidayModal && selectedEvent && selectedEvent.isPublicHoliday && (
          <PublicHolidayViewModal
            isOpen={showHolidayModal}
            onClose={handleCloseModals}
            holiday={selectedEvent}
          />
        )}

        <CalendarLoadingToast
          isLoading={loading}
          isFetching={loading}
          delayMs={300}
        />
      </>
    );
  }

  // Desktop View
  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden">
      {/* Sidebar */}
      <CalendarSidebar
        monthIndex={monthIndex}
        daySelected={daySelected}
        setDaySelected={setDaySelected}
        setSmallCalendarMonth={setSmallCalendarMonth}
        onCreateEvent={handleCreateEvent}
        labels={labels}
        updateLabel={updateLabel}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <CalendarHeader
          monthIndex={monthIndex}
          setMonthIndex={setMonthIndex}
          currentView={currentView}
          onViewChange={setCurrentView}
          isNavigating={loading} // ✅ PASS LOADING STATE
        />

        {/* Calendar View */}
        <div className="flex-1 overflow-auto">
          {renderView()}
        </div>

        {/* ✅ Unified Loading Toast - Handles ALL loading states */}
        <CalendarLoadingToast
          isLoading={loading || isCreating || isUpdating || isDeleting}
          isFetching={loading}
          message={
            isCreating ? 'Creating event...' :
              isUpdating ? 'Updating event...' :
                isDeleting ? 'Deleting event...' :
                  'Loading events...'
          }
          delayMs={200} // Show faster for mutations (200ms vs 500ms)
        />
      </div>

      {/* ✅ Event Modal - Regular Events */}
      {showEventModal && !selectedEvent?.isPublicHoliday && (
        <EventModal
          isOpen={showEventModal}
          onClose={handleCloseModals}
          daySelected={daySelected}
          selectedEvent={selectedEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* ✅ Public Holiday Modal - Read-Only */}
      {showHolidayModal && selectedEvent?.isPublicHoliday && (
        <PublicHolidayViewModal
          isOpen={showHolidayModal}
          onClose={handleCloseModals}
          holiday={selectedEvent}
        />
      )}
    </div>
  );
};

export default CalendarPage;