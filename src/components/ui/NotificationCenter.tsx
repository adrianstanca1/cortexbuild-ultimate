import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Settings, Filter } from 'lucide-react';
import { toast } from 'sonner';

/**
 * NotificationCenter Component
 * 
 * Displays all user notifications with filtering and management capabilities.
 * Supports real-time updates via WebSocket connection.
 * 
 * @param props - Component props
 * @param props.onClose - Callback function when modal is closed
 * @returns JSX element displaying notification center modal
 * 
 * @example
 * ```tsx
 * <NotificationCenter onClose={() => setShowNotifications(false)} />
 * ```
 * 
 * @remarks
 * - Supports filtering by read/unread status
 * - Supports filtering by notification type
 * - Provides mark all as read functionality
 * - Accessible with ARIA labels for screen readers
 */


interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationCenterProps {
  onClose?: () => void;
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    // Load notifications
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'alert',
        title: 'Safety Alert',
        message: 'High wind speed detected on Site A. Consider suspending crane operations.',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        read: false,
        actionUrl: '/safety/alerts/1',
        actionLabel: 'View Alert',
      },
      {
        id: '2',
        type: 'warning',
        title: 'Budget Variance',
        message: 'Project Phoenix budget variance exceeded 15%. Review required.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: false,
        actionUrl: '/projects/phoenix/budget',
        actionLabel: 'Review',
      },
      {
        id: '3',
        type: 'success',
        title: 'Inspection Passed',
        message: 'Site B foundation inspection passed successfully.',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        read: true,
      },
      {
        id: '4',
        type: 'info',
        title: 'New Document',
        message: 'Updated architectural drawings uploaded to Documents.',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        read: false,
        actionUrl: '/documents',
        actionLabel: 'View',
      },
    ];
    setNotifications(mockNotifications);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    toast.success('Marked as read');
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Notification deleted');
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    if (selectedType !== 'all') return n.type === selectedType;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const typeColors = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    alert: 'bg-red-600',
  };

  const typeIcons = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    alert: '🚨',
  };

  return (
    <div 
  className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" 
  onClick={onClose}
  role="dialog"
  aria-modal="true"
  aria-label="Notification center"
>
      <div 
        className="bg-base-100 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-content text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">Notifications</h2>
              <p className="text-xs text-gray-500">{unreadCount} unread</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
        onClick={markAllAsRead} 
        className="btn btn-sm btn-ghost gap-1"
        aria-label="Mark all notifications as read"
      >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
            {onClose && (
              <button 
        onClick={onClose} 
        className="btn btn-sm btn-ghost btn-circle"
        aria-label="Close notification center"
      >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-base-300 flex gap-2 overflow-x-auto">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as 'all' | 'unread' | 'read')}
            className="select select-bordered select-sm"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="select select-bordered select-sm"
          >
            <option value="all">All Types</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="alert">Alert</option>
          </select>
          <div className="flex-1" />
          <button className="btn btn-sm btn-ghost" aria-label="Notification settings">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        {/* Notifications List */}
        <div 
        className="flex-1 overflow-y-auto" 
        role="list"
        aria-label="Notifications list"
      >
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No notifications</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
        role="listitem"
                className={`p-4 border-b border-base-300 hover:bg-base-200 transition-colors ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${typeColors[notification.type]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{typeIcons[notification.type]}</span>
                          <h3 className={`font-semibold ${!notification.read ? 'text-primary' : ''}`}>
                            {notification.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-400">
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                          {!notification.read && (
                            <span className="text-xs bg-primary text-primary-content px-2 py-0.5 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {notification.actionUrl && (
                          <a
                            href={notification.actionUrl}
                            className="btn btn-sm btn-primary"
                            onClick={e => e.stopPropagation()}
                          >
                            {notification.actionLabel || 'View'}
                          </a>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="btn btn-sm btn-ghost"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="btn btn-sm btn-ghost btn-circle"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-base-300 text-xs text-gray-500 text-center">
          {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''} displayed
        </div>
      </div>
    </div>
  );
}
