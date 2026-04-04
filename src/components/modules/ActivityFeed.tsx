import { useState, useEffect } from 'react';
import {
  Activity, Edit, CheckCircle, AlertTriangle,
  MessageSquare, FileText, Users, Calendar, DollarSign,
  TrendingUp, Clock, Filter, Search, Eye,
  ChevronDown, ExternalLink
} from 'lucide-react';
import { getToken, API_BASE } from '../../lib/supabase';
import { EmptyState } from '../ui/EmptyState';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  user_name: string;
  user_role: string;
  description: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

type ActivityFilter = 'all' | 'projects' | 'invoices' | 'safety' | 'team' | 'rfis' | 'documents';

const ENTITY_ICONS: Record<string, typeof Activity> = {
  projects: TrendingUp,
  invoices: DollarSign,
  safety: AlertTriangle,
  team: Users,
  rfis: MessageSquare,
  documents: FileText,
  meetings: Calendar,
  change_orders: Edit,
  punch_list: CheckCircle,
  inspections: Eye,
  default: Activity,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-500/10 text-green-400',
  update: 'bg-blue-500/10 text-blue-400',
  delete: 'bg-red-500/10 text-red-400',
  complete: 'bg-emerald-500/10 text-emerald-400',
  approve: 'bg-purple-500/10 text-purple-400',
  reject: 'bg-orange-500/10 text-orange-400',
  default: 'bg-gray-500/10 text-gray-400',
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, timeRange]);

  async function loadActivities() {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('entity_type', filter);
      if (timeRange !== 'all') params.set('time_range', timeRange);

      const res = await fetch(`${API_BASE}/activity-feed?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  }

  function getActionType(action: string): string {
    const lower = action.toLowerCase();
    if (lower.includes('creat') || lower.includes('add') || lower.includes('new')) return 'create';
    if (lower.includes('delet') || lower.includes('remov')) return 'delete';
    if (lower.includes('complet') || lower.includes('finish') || lower.includes('done')) return 'complete';
    if (lower.includes('approv')) return 'approve';
    if (lower.includes('reject')) return 'reject';
    if (lower.includes('update') || lower.includes('edit') || lower.includes('chang')) return 'update';
    return 'default';
  }

  function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  function groupByDate(items: ActivityItem[]): Map<string, ActivityItem[]> {
    const groups = new Map<string, ActivityItem[]>();
    items.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)!.push(item);
    });
    return groups;
  }

  const filteredActivities = searchQuery
    ? activities.filter(a =>
        a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.entity_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activities;

  const groupedActivities = groupByDate(filteredActivities);

  const stats = {
    total: activities.length,
    today: activities.filter(a => {
      const d = new Date(a.created_at);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length,
    thisWeek: activities.filter(a => {
      const d = new Date(a.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }).length,
    uniqueUsers: new Set(activities.map(a => a.user_name)).size,
  };

  const filters: { key: ActivityFilter; label: string; icon: typeof Activity }[] = [
    { key: 'all', label: 'All Activity', icon: Activity },
    { key: 'projects', label: 'Projects', icon: TrendingUp },
    { key: 'invoices', label: 'Invoices', icon: DollarSign },
    { key: 'safety', label: 'Safety', icon: AlertTriangle },
    { key: 'team', label: 'Team', icon: Users },
    { key: 'rfis', label: 'RFIs', icon: MessageSquare },
    { key: 'documents', label: 'Documents', icon: FileText },
  ];

  return (
    <>
      <ModuleBreadcrumbs currentModule="activity-feed" onNavigate={() => {}} />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Activity Feed</h2>
            <p className="text-gray-400 text-sm mt-1">Real-time activity across all modules</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
              >
                <Filter size={14} />
                <span>{filter === 'all' ? 'All' : filter}</span>
                <ChevronDown size={14} />
              </button>
              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                  {filters.map(f => (
                    <button
                      key={f.key}
                      onClick={() => { setFilter(f.key); setShowFilters(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                        filter === f.key
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <f.icon size={14} />
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value as typeof timeRange)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 outline-none focus:ring-1 focus:ring-amber-500/50"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Total Activities</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Clock className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Today</p>
                <p className="text-2xl font-bold text-green-400">{stats.today}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Calendar className="text-amber-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs">This Week</p>
                <p className="text-2xl font-bold text-amber-400">{stats.thisWeek}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Active Users</p>
                <p className="text-2xl font-bold text-purple-400">{stats.uniqueUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 rounded-lg border border-gray-700">
          <Search size={16} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none flex-1"
          />
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <Activity size={32} className="mx-auto mb-3 animate-pulse" />
              <p>Loading activity feed...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity found"
              description={searchQuery ? 'Try a different search term' : 'Activity will appear here as you use the platform'}
              variant="default"
            />
          ) : (
            Array.from(groupedActivities.entries()).map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-gray-800" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{date}</span>
                  <div className="flex-1 h-px bg-gray-800" />
                </div>
                <div className="space-y-2">
                  {items.map(activity => {
                    const Icon = ENTITY_ICONS[activity.entity_type] || ENTITY_ICONS.default;
                    const actionType = getActionType(activity.action);
                    const colorClass = ACTION_COLORS[actionType] || ACTION_COLORS.default;

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700/50 transition-colors group"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm text-white">
                                <span className="font-medium">{activity.user_name}</span>
                                {' '}
                                <span className="text-gray-400">{activity.description}</span>
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
                                  {activity.action}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {activity.entity_type}
                                </span>
                                {activity.entity_name && (
                                  <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {activity.entity_name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-600">{timeAgo(activity.created_at)}</span>
                              <button className="p-1 hover:bg-gray-700 rounded text-gray-600 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
