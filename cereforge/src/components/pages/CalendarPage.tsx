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
import { CalendarEvent } from '../../types/calendar.types';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type CalendarView = 'day' | 'week' | 'month' | 'year';

const CalendarPage = () => {
    useDocumentTitle(
        "Cereforge - Calendar",
        "Calendar - Manage your events and schedules at Cereforge",
        "/Calender"
    );

    // Custom hook for event management
    const {
        filteredEvents,
        labels,
        addEvent,
        updateEvent,
        deleteEvent,
        updateLabel
    } = useCalendarEvents();

    // Responsive state - detect if mobile
    const [isMobile, setIsMobile] = useState(false);

    // Calendar state
    const [monthIndex, setMonthIndex] = useState(dayjs().month());
    const [daySelected, setDaySelected] = useState<Dayjs>(dayjs());
    const [smallCalendarMonth, setSmallCalendarMonth] = useState<number | null>(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [currentView, setCurrentView] = useState<CalendarView>('month');

    // Detect screen size for mobile/desktop
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        // Check on mount
        checkMobile();

        // Add resize listener
        window.addEventListener('resize', checkMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Sync small calendar with main calendar
    useEffect(() => {
        if (smallCalendarMonth !== null) {
            setMonthIndex(smallCalendarMonth);
        }
    }, [smallCalendarMonth]);

    // Calculate week start for week view
    const weekStart = daySelected.startOf('week');

    // Get current year for year view
    const currentYear = dayjs(new Date(dayjs().year(), monthIndex)).year();

    // Handlers
    const handleDayClick = (day: Dayjs) => {
        setDaySelected(day);
        setSelectedEvent(null);
        setShowEventModal(true);
    };

    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setDaySelected(dayjs(event.day));
        setShowEventModal(true);
    };

    const handleSaveEvent = (event: CalendarEvent) => {
        if (selectedEvent) {
            updateEvent(event);
        } else {
            addEvent(event);
        }
        setShowEventModal(false);
        setSelectedEvent(null);
    };

    const handleCreateEvent = () => {
        setSelectedEvent(null);
        setShowEventModal(true);
    };

    const handleDeleteEvent = (eventId: string) => {
        deleteEvent(eventId);
        setShowEventModal(false);
        setSelectedEvent(null);
    };

    const handleTimeSlotClick = (time: string) => {
        const selectedTime = daySelected.hour(parseInt(time.split(':')[0])).minute(0);
        setDaySelected(selectedTime);
        setSelectedEvent(null);
        setShowEventModal(true);
    };

    const handleMonthClick = (monthIdx: number) => {
        setMonthIndex(monthIdx);
        setCurrentView('month');
    };

    // Render current view (Desktop only)
    const renderView = () => {
        switch (currentView) {
            case 'day':
                return (
                    <CalendarDayView
                        daySelected={daySelected}
                        filteredEvents={filteredEvents}
                        onEventClick={handleEventClick}
                        onTimeSlotClick={handleTimeSlotClick}
                    />
                );

            case 'week':
                return (
                    <CalendarWeekView
                        weekStart={weekStart}
                        filteredEvents={filteredEvents}
                        onEventClick={handleEventClick}
                        onDayClick={handleDayClick}
                    />
                );

            case 'year':
                return (
                    <CalendarYearView
                        year={currentYear}
                        filteredEvents={filteredEvents}
                        onDayClick={handleDayClick}
                        onMonthClick={handleMonthClick}
                    />
                );

            case 'month':
            default:
                return (
                    <CalendarGrid
                        monthIndex={monthIndex}
                        filteredEvents={filteredEvents}
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
                    events={filteredEvents}
                    onEventClick={handleEventClick}
                    onDayClick={handleDayClick}
                    onCreateEvent={handleCreateEvent}
                    daySelected={daySelected}
                />

                {/* Event Modal for Mobile */}
                {showEventModal && (
                    <EventModal
                        isOpen={showEventModal}
                        onClose={() => {
                            setShowEventModal(false);
                            setSelectedEvent(null);
                        }}
                        daySelected={daySelected}
                        selectedEvent={selectedEvent}
                        onSave={handleSaveEvent}
                        onDelete={handleDeleteEvent}
                    />
                )}
            </>
        );
    }

    // Desktop View
    return (
        <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden">
            {/* Sidebar - Fixed with independent scroll */}
            <CalendarSidebar
                monthIndex={monthIndex}
                daySelected={daySelected}
                setDaySelected={setDaySelected}
                setSmallCalendarMonth={setSmallCalendarMonth}
                onCreateEvent={handleCreateEvent}
                labels={labels}
                updateLabel={updateLabel}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Calendar Header - Fixed at top */}
                <CalendarHeader
                    monthIndex={monthIndex}
                    setMonthIndex={setMonthIndex}
                    currentView={currentView}
                    onViewChange={setCurrentView}
                />

                {/* Calendar View - Scrollable */}
                <div className="flex-1 overflow-auto">
                    {renderView()}
                </div>
            </div>

            {/* Event Modal */}
            {showEventModal && (
                <EventModal
                    isOpen={showEventModal}
                    onClose={() => {
                        setShowEventModal(false);
                        setSelectedEvent(null);
                    }}
                    daySelected={daySelected}
                    selectedEvent={selectedEvent}
                    onSave={handleSaveEvent}
                    onDelete={handleDeleteEvent}
                />
            )}
        </div>
    );
};

export default CalendarPage;