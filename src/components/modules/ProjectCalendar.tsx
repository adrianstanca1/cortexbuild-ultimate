import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'meeting' | 'deadline' | 'inspection' | 'delivery' | 'other';
  start: string;
  end?: string;
  location?: string;
  attendees?: string[];
  projectId?: string;
  color?: string;
}

export function ProjectCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    // Load events
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Site Inspection',
        type: 'inspection',
        start: new Date(Date.now() + 86400000).toISOString(),
        location: 'Site A',
        attendees: ['James Miller', 'Sarah Chen'],
        color: '#F59E0B',
      },
      {
        id: '2',
        title: 'Budget Review Meeting',
        type: 'meeting',
        start: new Date(Date.now() + 172800000).toISOString(),
        end: new Date(Date.now() + 183600000).toISOString(),
        attendees: ['Patricia Watson', 'Michael Brown'],
        color: '#3B82F6',
      },
      {
        id: '3',
        title: 'Material Delivery',
        type: 'delivery',
        start: new Date(Date.now() + 259200000).toISOString(),
        location: 'Site B',
        color: '#10B981',
      },
      {
        id: '4',
        title: 'Project Deadline',
        type: 'deadline',
        start: new Date(Date.now() + 604800000).toISOString(),
        color: '#EF4444',
      },
    ];
    setEvents(mockEvents);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDay = (date: Date | null) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-1">
            <button onClick={() => navigateMonth('prev')} className="btn btn-sm btn-ghost btn-circle">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => navigateMonth('next')} className="btn btn-sm btn-ghost btn-circle">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="btn-group">
            <button
              onClick={() => setView('month')}
              className={`btn btn-sm ${view === 'month' ? 'btn-active' : ''}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`btn btn-sm ${view === 'week' ? 'btn-active' : ''}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`btn btn-sm ${view === 'day' ? 'btn-active' : ''}`}
            >
              Day
            </button>
          </div>
          <button className="btn btn-primary btn-sm gap-2">
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-base-300 border border-base-300 rounded-lg overflow-hidden">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-base-200 p-2 text-center text-sm font-semibold">
            {day}
          </div>
        ))}

        {/* Days */}
        {days.map((date, index) => {
          const dayEvents = getEventsForDay(date);
          const isToday = date?.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`bg-base-100 min-h-[100px] p-2 ${!date ? 'bg-base-200' : ''}`}
            >
              {date && (
                <>
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded truncate text-white"
                        style={{ backgroundColor: event.color }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming Events */}
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h3 className="card-title">Upcoming Events</h3>
          <div className="space-y-2">
            {events.slice(0, 5).map(event => (
              <div key={event.id} className="flex items-center gap-3 p-2 bg-base-200 rounded">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{event.title}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(event.start).toLocaleString()}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                    )}
                    {event.attendees && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.attendees.length} attendees
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export default React.memo(ProjectCalendar);
