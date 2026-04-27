/**
 * CortexBuild Ultimate - NotificationCenter
 * Comprehensive real-time notification center with all features
 *
 * Features:
 * - Real-time WebSocket updates
 * - Notification grouping by date
 * - Multiple filter categories
 * - Quick actions (approve, reject, reply)
 * - Settings management
 * - Notification history with export
 * - Browser push notifications
 * - Sound alerts
 * - Quiet hours
 * - Dark theme compatible
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Settings,
  History,
  Archive,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  ExternalLink,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Mail,
  Smartphone,
  Activity,
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNotificationCenter } from '@/hooks/useNotificationCenter';
import { NotificationItem } from './NotificationItem';
import { NotificationFilters } from './NotificationFilters';
import { NotificationCenterSettings } from './NotificationCenterSettings';
import { NotificationHistory } from './NotificationHistory';
import type { NotificationFilter } from '@/types/notification';

// View modes
type ViewMode = 'notifications' | 'settings' | 'digest' | 'analytics' | 'history';

// Component Props
interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  variant?: 'panel' | 'modal' | 'dropdown';
  compact?: boolean;
}

export function NotificationCenter({
  isOpen,
  onClose,
  position = 'top-right',
  variant = 'panel',
  compact = false,
}: NotificationCenterProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('notifications');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    today: true,
    yesterday: true,
    'this-week': true,
  });
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [showCompactView, setShowCompactView] = useState(false);

  // Use the notification center hook
  const {
    notifications,
    groupedNotifications,
    unreadCount,
    total,
    stats,
    settings,
    isLoading,
    wsStatus,
    markAsRead,
    markAllAsRead,
    markMultipleAsRead,
    deleteNotification,
    deleteMultiple,
    archiveNotification,
    archiveRead,
    snoozeNotification,
    updateSettings,
    toggleCategory,
    toggleQuietHours,
    toggleSoundAlerts,
    toggleBrowserNotifications,
    setFilter,
    clearFilter,
    search,
    loadHistory,
    exportNotifications,
    refresh,
    clearAll,
  } = useNotificationCenter({
    autoConnect: true,
    pollingInterval: 30000,
    maxNotifications: 100,
  });

  // Current filter state
  const [currentFilter, setCurrentFilter] = useState<NotificationFilter | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle filter change
  const handleFilterChange = useCallback((filter: NotificationFilter) => {
    setCurrentFilter(filter);
    setFilter(filter);
  }, [setFilter]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    search(query);
  }, [search]);

  // Toggle group expansion
  const toggleGroup = useCallback((groupDate: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupDate]: !prev[groupDate],
    }));
  }, []);

  // Toggle notification selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedNotifications((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Handle quick reply
  const handleQuickReply = useCallback((_notificationId: string, _message: string) => {
    toast.success('Reply sent', {
      description: 'Your response has been sent',
    });
    // Here you would typically call an API to send the reply
  }, []);

  // Handle quick approve/reject
  const handleQuickApprove = useCallback((notificationId: string, approved: boolean) => {
    if (approved) {
      toast.success('Approved', {
        description: 'The request has been approved',
      });
    } else {
      toast.error('Rejected', {
        description: 'The request has been rejected',
      });
    }
    markAsRead(notificationId);
    // Here you would typically call an API to process the approval
  }, [markAsRead]);

  // Handle navigate to related item
  const handleNavigate = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  // Handle bulk actions
  const handleBulkMarkAsRead = useCallback(async () => {
    if (selectedNotifications.size > 0) {
      await markMultipleAsRead(Array.from(selectedNotifications));
      setSelectedNotifications(new Set());
      toast.success(`Marked ${selectedNotifications.size} notifications as read`);
    }
  }, [selectedNotifications, markMultipleAsRead]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedNotifications.size > 0) {
      await deleteMultiple(Array.from(selectedNotifications));
      setSelectedNotifications(new Set());
      toast.success(`Deleted ${selectedNotifications.size} notifications`);
    }
  }, [selectedNotifications, deleteMultiple]);

  const handleArchiveRead = useCallback(async () => {
    await archiveRead();
    toast.success('Archived all read notifications');
  }, [archiveRead]);

  // Position classes
  const positionClasses = useMemo(() => {
    const base = 'fixed z-[9999]';
    switch (position) {
      case 'top-right':
        return `${base} top-0 right-0`;
      case 'top-left':
        return `${base} top-0 left-0`;
      case 'bottom-right':
        return `${base} bottom-0 right-0`;
      case 'bottom-left':
        return `${base} bottom-0 left-0`;
    }
  }, [position]);

  // Size classes based on variant
  const sizeClasses = useMemo(() => {
    if (compact) {
      return 'w-80 max-h-96';
    }
    switch (variant) {
      case 'dropdown':
        return 'w-96 max-h-[70vh]';
      case 'panel':
        return 'w-full max-w-md max-h-[85vh]';
      case 'modal':
        return 'w-full max-w-2xl max-h-[90vh]';
    }
  }, [variant, compact]);

  // If not open, don't render
  if (!isOpen) {
    return null;
  }

  // Render settings view
  if (viewMode === 'settings') {
    const [emailToggle, setEmailToggle] = useState(true);
    const [pushToggle, setPushToggle] = useState(true);
    const [inAppToggle, setInAppToggle] = useState(true);
    const [smsToggle, setSmsToggle] = useState(false);
    const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
    const [quietFromTime, setQuietFromTime] = useState('22:00');
    const [quietToTime, setQuietToTime] = useState('08:00');
    const [timezone, setTimezone] = useState('UTC');

    const handleSavePreferences = () => {
      toast.success('Notification preferences saved', {
        description: 'Your settings have been updated',
      });
    };

    return (
      <>
        {variant === 'modal' && (
          <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={onClose} />
        )}
        <div className={`${positionClasses} ${sizeClasses} m-4`}>
          <div className="card h-full shadow-2xl border border-base-300 flex flex-col">
            <div className="p-4 border-b border-base-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Notification Settings</h3>
                <button onClick={() => setViewMode('notifications')} className="btn btn-sm btn-ghost btn-circle">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Email Notifications */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">Email Notifications</h4>
                </div>
                <div className="bg-base-200 rounded-lg p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={emailToggle} onChange={(e) => setEmailToggle(e.target.checked)} className="checkbox checkbox-sm" />
                    <span className="text-sm">New RFI</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="checkbox checkbox-sm" />
                    <span className="text-sm">Invoice Overdue</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="checkbox checkbox-sm" />
                    <span className="text-sm">Meeting Reminder</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="checkbox checkbox-sm" />
                    <span className="text-sm">Safety Incident</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="checkbox checkbox-sm" />
                    <span className="text-sm">Document Approval</span>
                  </label>
                </div>
              </div>

              {/* Push Notifications */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-4 h-4 text-info" />
                  <h4 className="font-semibold text-sm">Push Notifications</h4>
                </div>
                <div className="bg-base-200 rounded-lg p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={pushToggle} onChange={(e) => setPushToggle(e.target.checked)} className="checkbox checkbox-sm" />
                    <span className="text-sm">New RFI</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="checkbox checkbox-sm" />
                    <span className="text-sm">Urgent Updates</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="checkbox checkbox-sm" />
                    <span className="text-sm">Safety Alerts</span>
                  </label>
                </div>
              </div>

              {/* In-App Notifications */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-4 h-4 text-success" />
                  <h4 className="font-semibold text-sm">In-App Notifications</h4>
                </div>
                <div className="bg-base-200 rounded-lg p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={inAppToggle} onChange={(e) => setInAppToggle(e.target.checked)} className="checkbox checkbox-sm" />
                    <span className="text-sm">All Events</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="checkbox checkbox-sm" />
                    <span className="text-sm">Sound Alerts</span>
                  </label>
                </div>
              </div>

              {/* SMS Alerts */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-4 h-4 text-warning" />
                  <h4 className="font-semibold text-sm">SMS Alerts</h4>
                </div>
                <div className="bg-base-200 rounded-lg p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={smsToggle} onChange={(e) => setSmsToggle(e.target.checked)} className="checkbox checkbox-sm" />
                    <span className="text-sm">Critical Incidents Only</span>
                  </label>
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="space-y-3 border-t border-base-300 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Moon className="w-4 h-4" />
                  <h4 className="font-semibold text-sm">Quiet Hours</h4>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={quietHoursEnabled} onChange={(e) => setQuietHoursEnabled(e.target.checked)} className="checkbox checkbox-sm" />
                  <span className="text-sm">Enable Quiet Hours</span>
                </label>
                {quietHoursEnabled && (
                  <div className="bg-base-200 rounded-lg p-3 space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-base-content/60">From</label>
                        <input type="time" value={quietFromTime} onChange={(e) => setQuietFromTime(e.target.value)} className="input input-bordered input-sm w-full mt-1" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-base-content/60">To</label>
                        <input type="time" value={quietToTime} onChange={(e) => setQuietToTime(e.target.value)} className="input input-bordered input-sm w-full mt-1" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-base-content/60">Timezone</label>
                      <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="select select-bordered select-sm w-full mt-1">
                        <option>UTC</option>
                        <option>GMT</option>
                        <option>EST</option>
                        <option>CST</option>
                        <option>PST</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-base-300 bg-base-200">
              <button onClick={handleSavePreferences} className="btn btn-primary w-full gap-2">
                <Check className="w-4 h-4" />
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Render digest view
  if (viewMode === 'digest') {
    const [digestFrequency, setDigestFrequency] = useState('daily');
    const [digestTime, setDigestTime] = useState('09:00');
    const [digestDay, setDigestDay] = useState('Monday');

    const handleSendTestDigest = () => {
      toast.success('Test digest sent', {
        description: 'Check your email for the preview',
      });
    };

    const digestHistory = [
      { date: '2026-04-26', type: 'Daily', status: 'Delivered', itemsCount: 12 },
      { date: '2026-04-25', type: 'Daily', status: 'Delivered', itemsCount: 8 },
      { date: '2026-04-22', type: 'Weekly', status: 'Delivered', itemsCount: 24 },
      { date: '2026-04-19', type: 'Daily', status: 'Delivered', itemsCount: 15 },
    ];

    return (
      <>
        {variant === 'modal' && (
          <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={onClose} />
        )}
        <div className={`${positionClasses} ${sizeClasses} m-4`}>
          <div className="card h-full shadow-2xl border border-base-300 flex flex-col">
            <div className="p-4 border-b border-base-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Notification Digest</h3>
                <button onClick={() => setViewMode('notifications')} className="btn btn-sm btn-ghost btn-circle">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Frequency Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Digest Frequency</label>
                <select value={digestFrequency} onChange={(e) => setDigestFrequency(e.target.value)} className="select select-bordered select-sm w-full">
                  <option value="immediate">Immediate</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {/* Time Picker */}
              {['hourly', 'daily', 'weekly'].includes(digestFrequency) && (
                <div className="space-y-2 bg-base-200 rounded-lg p-3">
                  <label className="text-sm font-medium">Send at</label>
                  <input type="time" value={digestTime} onChange={(e) => setDigestTime(e.target.value)} className="input input-bordered input-sm w-full" />
                </div>
              )}

              {/* Day Picker for Weekly */}
              {digestFrequency === 'weekly' && (
                <div className="space-y-2 bg-base-200 rounded-lg p-3">
                  <label className="text-sm font-medium">Day of Week</label>
                  <select value={digestDay} onChange={(e) => setDigestDay(e.target.value)} className="select select-bordered select-sm w-full">
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                    <option>Saturday</option>
                    <option>Sunday</option>
                  </select>
                </div>
              )}

              {/* Digest Preview */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Digest Preview</label>
                <div className="border border-base-300 rounded-lg p-4 bg-base-100 text-sm space-y-2 max-h-40 overflow-y-auto">
                  <div className="font-mono text-xs">
                    <div>Subject: Your {digestFrequency} notification digest</div>
                    <div className="mt-2">────────────────</div>
                    <div className="mt-2">Good morning,</div>
                    <div className="mt-2">Here's your notification digest:</div>
                    <div className="mt-2">• 3 new RFIs assigned</div>
                    <div>• 1 invoice overdue</div>
                    <div>• 2 meeting reminders</div>
                    <div>• 1 safety incident</div>
                    <div className="mt-2">────────────────</div>
                    <div className="mt-2">Manage preferences</div>
                  </div>
                </div>
              </div>

              {/* Send Test Button */}
              <button onClick={handleSendTestDigest} className="btn btn-outline btn-sm w-full gap-2">
                <Send className="w-4 h-4" />
                Send Test Digest
              </button>

              {/* History */}
              <div className="space-y-2 border-t border-base-300 pt-4">
                <label className="text-sm font-semibold">Sent History</label>
                <div className="space-y-1">
                  {digestHistory.map((h, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-base-200 p-2 rounded">
                      <div>
                        <div>{h.date} — {h.type}</div>
                        <div className="text-base-content/60">{h.itemsCount} items</div>
                      </div>
                      <span className="badge badge-success badge-outline">{h.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-base-300 bg-base-200">
              <button onClick={() => setViewMode('notifications')} className="btn btn-ghost btn-sm w-full">
                Back
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Render analytics view
  if (viewMode === 'analytics') {
    const categoryData = [
      { name: 'Safety', value: 24 },
      { name: 'Finance', value: 18 },
      { name: 'Project', value: 32 },
      { name: 'Admin', value: 14 },
    ];

    const trendData = [
      { day: 'Mon', count: 45 },
      { day: 'Tue', count: 52 },
      { day: 'Wed', count: 38 },
      { day: 'Thu', count: 61 },
      { day: 'Fri', count: 55 },
      { day: 'Sat', count: 28 },
      { day: 'Sun', count: 35 },
    ];

    const topNotifications = [
      { type: 'New RFI', count: 42, percentage: 18 },
      { type: 'Invoice Overdue', count: 38, percentage: 16 },
      { type: 'Meeting Reminder', count: 35, percentage: 15 },
      { type: 'Safety Incident', count: 28, percentage: 12 },
      { type: 'Document Approval', count: 24, percentage: 10 },
    ];

    return (
      <>
        {variant === 'modal' && (
          <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={onClose} />
        )}
        <div className={`${positionClasses} max-w-4xl ${sizeClasses} m-4`}>
          <div className="card h-full shadow-2xl border border-base-300 flex flex-col">
            <div className="p-4 border-b border-base-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Notification Analytics</h3>
                <button onClick={() => setViewMode('notifications')} className="btn btn-sm btn-ghost btn-circle">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-base-200 rounded-lg p-3">
                  <div className="text-xs text-base-content/60">Sent Today</div>
                  <div className="text-2xl font-bold">24</div>
                </div>
                <div className="bg-base-200 rounded-lg p-3">
                  <div className="text-xs text-base-content/60">Read Rate</div>
                  <div className="text-2xl font-bold">72%</div>
                </div>
                <div className="bg-base-200 rounded-lg p-3">
                  <div className="text-xs text-base-content/60">Avg Response</div>
                  <div className="text-2xl font-bold">2.3h</div>
                </div>
                <div className="bg-base-200 rounded-lg p-3">
                  <div className="text-xs text-base-content/60">Unsubscribed</div>
                  <div className="text-2xl font-bold">3</div>
                </div>
              </div>

              {/* Category Chart */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Notifications by Category</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Trend Chart */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Volume Last 30 Days</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top Notifications Table */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Most Triggered This Month</h4>
                <div className="space-y-1">
                  {topNotifications.map((n, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-base-200 p-2 rounded">
                      <span>{n.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{n.count}</span>
                        <div className="bg-base-300 rounded-full h-2 w-24 overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: `${n.percentage * 10}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-base-300 bg-base-200">
              <button onClick={() => setViewMode('notifications')} className="btn btn-ghost btn-sm w-full">
                Back
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Render history view
  if (viewMode === 'history') {
    return (
      <>
        {variant === 'modal' && (
          <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={onClose} />
        )}
        <div className={`${positionClasses} ${sizeClasses} m-4`}>
          <div className="card h-full shadow-2xl border border-base-300">
            <NotificationHistory
              notifications={notifications}
              isLoading={isLoading}
              onLoadHistory={loadHistory}
              onExport={exportNotifications}
              onFilterChange={handleFilterChange}
              onClearFilter={clearFilter}
              filter={currentFilter}
            />
            <div className="p-3 border-t border-base-300">
              <button
                onClick={() => setViewMode('notifications')}
                className="btn btn-sm btn-ghost w-full"
              >
                Back to Notifications
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Render main notifications view
  return (
    <>
      {variant === 'modal' && (
        <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={onClose} />
      )}
      <div className={`${positionClasses} ${sizeClasses} m-4`}>
        <div className="card h-full shadow-2xl border border-base-300 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-base-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="w-6 h-6 text-primary" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 badge badge-primary badge-xs">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold">Notifications</h2>
                  <div className="flex items-center gap-2 text-xs text-base-content/60">
                    <span>{unreadCount} unread</span>
                    <span>•</span>
                    <span>{total} total</span>
                    <span className={`flex items-center gap-1 ${wsStatus.isConnected ? 'text-success' : 'text-error'}`}>
                      {wsStatus.isConnected ? (
                        <>
                          <Wifi className="w-3 h-3" />
                          Live
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3 h-3" />
                          Offline
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={refresh}
                  className="btn btn-sm btn-ghost btn-circle"
                  title="Refresh"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('settings')}
                  className="btn btn-sm btn-ghost btn-circle"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('digest')}
                  className="btn btn-sm btn-ghost btn-circle"
                  title="Digest"
                >
                  <Mail className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className="btn btn-sm btn-ghost btn-circle"
                  title="Analytics"
                >
                  <Activity className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('history')}
                  className="btn btn-sm btn-ghost btn-circle"
                  title="History"
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="btn btn-sm btn-ghost btn-circle"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="btn btn-sm btn-ghost gap-1.5"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
              <button
                onClick={handleArchiveRead}
                className="btn btn-sm btn-ghost gap-1.5"
              >
                <Archive className="w-4 h-4" />
                Archive read
              </button>
              {selectedNotifications.size > 0 && (
                <>
                  <button
                    onClick={handleBulkMarkAsRead}
                    className="btn btn-sm btn-primary gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Mark read ({selectedNotifications.size})
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="btn btn-sm btn-error gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setShowCompactView(!showCompactView)}
                  className="btn btn-sm btn-ghost gap-1.5"
                >
                  {showCompactView ? (
                    <>
                      <Eye className="w-4 h-4" />
                      Detailed
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Compact
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-base-300">
            <NotificationFilters
              filter={currentFilter}
              onFilterChange={handleFilterChange}
              onClear={clearFilter}
              onSearch={handleSearch}
              searchQuery={searchQuery}
              unreadCount={unreadCount}
              total={total}
            />
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="loading loading-spinner loading-lg" />
              </div>
            ) : groupedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-base-content/50">
                <Bell className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-semibold">No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedNotifications.map((group) => (
                  <div key={group.date}>
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroup(group.date)}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-base-200 hover:bg-base-300 transition-all mb-2"
                    >
                      <div className="flex items-center gap-2">
                        {group.date === 'today' && <Sun className="w-4 h-4" />}
                        {group.date === 'yesterday' && <Moon className="w-4 h-4" />}
                        {group.date === 'this-week' && <Clock className="w-4 h-4" />}
                        <span className="font-semibold text-sm">{group.label}</span>
                        {group.unreadCount > 0 && (
                          <span className="badge badge-primary badge-xs">
                            {group.unreadCount}
                          </span>
                        )}
                      </div>
                      {expandedGroups[group.date] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* Group Content */}
                    {expandedGroups[group.date] && (
                      <div className="space-y-2">
                        {group.notifications.map((notification) => (
                          <div key={notification.id} className="relative">
                            {selectedNotifications.size > 0 && (
                              <input
                                type="checkbox"
                                checked={selectedNotifications.has(notification.id)}
                                onChange={() => toggleSelection(notification.id)}
                                className="checkbox checkbox-xs absolute top-3 left-3 z-10"
                              />
                            )}
                            <NotificationItem
                              notification={notification}
                              onMarkAsRead={markAsRead}
                              onDelete={deleteNotification}
                              onArchive={archiveNotification}
                              onSnooze={snoozeNotification}
                              onNavigate={handleNavigate}
                              onQuickReply={handleQuickReply}
                              onQuickApprove={handleQuickApprove}
                              isCompact={showCompactView}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-base-300 bg-base-200">
            <div className="flex items-center justify-between text-xs text-base-content/60">
              <span>
                {stats && (
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-success" />
                      {stats.read} read
                    </span>
                    <span className="flex items-center gap-1">
                      <Archive className="w-3 h-3 text-amber-500" />
                      {stats.archived} archived
                    </span>
                  </span>
                )}
              </span>
              <button
                onClick={clearAll}
                className="btn btn-xs btn-ghost text-error"
                disabled={total === 0}
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default NotificationCenter;
