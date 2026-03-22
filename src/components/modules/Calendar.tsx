import React, { useState, useEffect, useCallback } from 'react';
import { calendarApi } from '@/services/api';
import { toast } from 'sonner';
import {
  Plus,
  MapPin,
  Filter,
  RefreshCw,
  CheckCircle2,
  Activity,
  Eye,
  Bell,
  Zap,
  Layers,
  Users,
  Truck,
  X,
  Play,
  Pause,
  RefreshCw as RefreshCwIcon,
  BarChart3,
  PieChart,
  Calendar as CalendarIcon,
  CheckCircle,
  UserCheck,
  UserX,
  Construction,
  DollarSign,
  Target,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar as RechartsBar, XAxis, YAxis, Tooltip, Legend, PieChart as RechartsPieChart, Pie as RechartsPie, Cell as RechartsCell } from 'recharts';

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  type: string;
  subtype?: string;
  status: string;
  project?: string;
  url: string;
}

interface CalendarFilters {
  view: 'day' | 'week' | 'month';
  currentDate: Date;
}

export function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<CalendarFilters>({
    view: 'month',
    currentDate: new Date(),
  });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date(filters.currentDate.getFullYear(), filters.currentDate.getMonth() - 1, 1);
      const end = new Date(filters.currentDate.getFullYear(), filters.currentDate.getMonth() + 2, 0);
      const data = await calendarApi.getEvents(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
      setEvents(data);
    } catch (err) {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [filters.currentDate]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getDayOfWeek = (date: Date) => {
    return date.getDay();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleViewChange = (view: 'day' | 'week' | 'month') => {
    setFilters(prev => ({ ...prev, view }));
  };

  const handleDateChange = (date: Date) => {
    setFilters(prev => ({ ...prev, currentDate: date }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Calendar</h2>
        <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <button
              onClick={() => {
                // TODO: Implement event creation modal
              }}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              New Event
            </button>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <select
              onChange={(e) => {
                const view = e.target.value as 'day' | 'week' | 'month';
                handleViewChange(view);
              }}
              value={filters.view}
              className="border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-400"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <button
              onClick={() => {
                // TODO: Implement filters modal
              }}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="h-6 w-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-500">Loading calendar...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar Grid */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Calendar Header */}
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-lg font-semibold">
                  {filters.currentDate.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                  })}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const prevDate = new Date(filters.currentDate);
                      prevDate.setMonth(prevDate.getMonth() - 1);
                      handleDateChange(prevDate);
                    }}
                    className="p-2 rounded hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      const nextDate = new Date(filters.currentDate);
                      nextDate.setMonth(nextDate.getMonth() + 1);
                      handleDateChange(nextDate);
                    }}
                    className="p-2 rounded hover:bg-gray-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      handleDateChange(new Date());
                    }}
                    className="p-2 rounded hover:bg-gray-50"
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Body - Simplified */}
              <div className="p-4">
                <div className="text-center py-8">
                  <p className="text-gray-500">Calendar view implementation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events Sidebar */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="border-b px-4 py-3">
                <h3 className="text-lg font-semibold">Upcoming Events</h3>
              </div>
              <div className="p-4 space-y-3">
{events
                   .filter(
                     (event) =>
                       new Date(event.startDate) >= new Date().setHours(0, 0, 0, 0)
                   )
                   .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                   .slice(0, 5)
                   .map((event) => (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium">{event.title}</h4>
<span className="text-xs text-gray-400">
                           {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {event.relatedTo ?? 'General'} • {new Date(event.start).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                {events.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No upcoming events
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
