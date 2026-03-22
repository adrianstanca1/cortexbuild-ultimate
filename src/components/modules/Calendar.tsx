import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Briefcase,
  AlertTriangle,
  ClipboardCheck,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { calendarApi } from '../../services/api';
import { toast } from 'sonner';
import clsx from 'clsx';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'project' | 'meeting' | 'inspection' | 'deadline' | string;
  subtype: string;
  startDate: string;
  endDate?: string;
  status: string;
  project?: string;
  time?: string;
  url: string;
}

const eventTypeColors: Record<string, { bg: string; border: string; text: string; icon: typeof CalendarIcon }> = {
  project: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', icon: Briefcase },
  meeting: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400', icon: Users },
  inspection: { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-400', icon: ClipboardCheck },
  deadline: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', icon: AlertTriangle },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      const data = await calendarApi.getEvents(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
      setEvents(data);
    } catch (err) {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.startDate === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const today = () => setCurrentDate(new Date());

  const filteredEvents = filterType === 'all' ? events : events.filter(e => e.type === filterType);

  const EventPill = ({ event }: { event: CalendarEvent }) => {
    const colors = eventTypeColors[event.type] || eventTypeColors.deadline;
    return (
      <button
        onClick={() => setSelectedEvent(event)}
        className={clsx(
          'w-full text-left px-2 py-1 rounded text-xs truncate hover:opacity-80 transition-opacity',
          colors.bg,
          colors.text
        )}
      >
        {event.title}
      </button>
    );
  };

  const CalendarDay = ({ day }: { day: number | null }) => {
    if (day === null) return <div className="h-28 bg-gray-900/30" />;
    
    const dayEvents = getEventsForDay(day);
    const isToday = new Date().getDate() === day &&
      new Date().getMonth() === currentDate.getMonth() &&
      new Date().getFullYear() === currentDate.getFullYear();

    return (
      <div className={clsx(
        'h-28 border border-gray-800 p-1 transition-colors',
        isToday ? 'bg-blue-900/20 border-blue-600' : 'bg-gray-900/50 hover:bg-gray-800/50'
      )}>
        <div className={clsx(
          'text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
          isToday ? 'bg-blue-600 text-white' : 'text-gray-400'
        )}>
          {day}
        </div>
        <div className="space-y-1 overflow-hidden">
          {dayEvents.slice(0, 3).map(event => (
            <EventPill key={event.id} event={event} />
          ))}
          {dayEvents.length > 3 && (
            <span className="text-xs text-gray-500 pl-2">+{dayEvents.length - 3} more</span>
          )}
        </div>
      </div>
    );
  };

  const EventModal = () => {
    if (!selectedEvent) return null;
    const colors = eventTypeColors[selectedEvent.type] || eventTypeColors.deadline;
    const Icon = colors.icon;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
          <div className="flex items-start gap-4">
            <div className={clsx('p-3 rounded-lg', colors.bg)}>
              <Icon className={clsx('h-6 w-6', colors.text)} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">{selectedEvent.title}</h3>
              <p className="text-sm text-gray-400">{selectedEvent.subtype}</p>
            </div>
            <button onClick={() => setSelectedEvent(null)} className="text-gray-500 hover:text-white">✕</button>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <span className="text-gray-300">{new Date(selectedEvent.startDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            {selectedEvent.time && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300">{selectedEvent.time}</span>
              </div>
            )}
            {selectedEvent.project && (
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300">{selectedEvent.project}</span>
              </div>
            )}
            <div className="pt-3 border-t border-gray-800">
              <span className={clsx(
                'px-2 py-1 rounded-full text-xs font-medium',
                selectedEvent.status === 'active' || selectedEvent.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400' :
                  selectedEvent.status === 'scheduled' || selectedEvent.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
              )}>
                {selectedEvent.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Calendar</h1>
          <p className="text-sm text-gray-500">View all your projects, meetings, and deadlines</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-2"
          >
            <option value="all">All Events</option>
            <option value="project">Projects</option>
            <option value="meeting">Meetings</option>
            <option value="inspection">Inspections</option>
            <option value="deadline">Deadlines</option>
          </select>
          <button onClick={loadEvents} className="btn btn-secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            </button>
            <h2 className="text-xl font-bold text-white min-w-48 text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={today} className="btn btn-secondary text-sm">Today</button>
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setView('month')}
                className={clsx('px-3 py-1 rounded text-sm transition-colors', view === 'month' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white')}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={clsx('px-3 py-1 rounded text-sm transition-colors', view === 'week' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white')}
              >
                Week
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7">
          {DAYS.map(day => (
            <div key={day} className="p-3 text-center text-xs text-gray-500 uppercase border-b border-gray-800">
              {day}
            </div>
          ))}
          {Array.from({ length: startingDay }).map((_, i) => (
            <CalendarDay key={`empty-${i}`} day={null} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => (
            <CalendarDay key={i + 1} day={i + 1} />
          ))}
        </div>

        <div className="p-4 border-t border-gray-800 flex items-center gap-6">
          {Object.entries(eventTypeColors).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={clsx('w-3 h-3 rounded', colors.bg, 'border', colors.border)} />
              <span className="text-xs text-gray-400 capitalize">{type}s</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">Upcoming Events</h3>
        </div>
        <div className="divide-y divide-gray-800">
          {filteredEvents
            .filter(e => new Date(e.startDate) >= new Date())
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .slice(0, 10)
            .map(event => {
              const colors = eventTypeColors[event.type] || eventTypeColors.deadline;
              const Icon = colors.icon;
              return (
                <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-gray-800/50 transition-colors">
                  <div className={clsx('p-2 rounded-lg', colors.bg)}>
                    <Icon className={clsx('h-4 w-4', colors.text)} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{event.title}</p>
                    <p className="text-xs text-gray-500">{event.subtype} {event.project && `• ${event.project}`}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-300">{new Date(event.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                    <p className="text-xs text-gray-500">{new Date(event.startDate).toLocaleDateString('en-GB', { weekday: 'short' })}</p>
                  </div>
                </div>
              );
            })}
          {filteredEvents.filter(e => new Date(e.startDate) >= new Date()).length === 0 && (
            <div className="p-8 text-center text-gray-500">No upcoming events</div>
          )}
        </div>
      </div>

      {selectedEvent && <EventModal />}
    </div>
  );
}
