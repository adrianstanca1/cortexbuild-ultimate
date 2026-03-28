/**
 * CortexBuild Ultimate — WebSocket Notifications Hook
 * Real-time notifications, dashboard updates, and alerts
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { notificationsApi } from '../services/api';
import { eventBus } from '../lib/eventBus';

const WS_URL = (() => {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
})();

type Notification = {
  id: string | number;
  type: 'notification' | 'alert' | 'dashboard_update' | 'collaboration' | 'system';
  title: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'error' | 'critical';
  timestamp: string;
  read: boolean;
  link?: string;
  data?: Record<string, unknown>;
};

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  markAsRead: (id: string | number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string | number) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(authToken: string | null): UseNotificationsReturn {
  const ws = useRef<WebSocket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    if (!authToken) {
      setIsLoading(false);
      return;
    }
    
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data as Notification[]);
    } catch (err) {
      console.error('[Notifications] Failed to load:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!authToken) return;

    try {
      ws.current = new WebSocket(`${WS_URL}?token=${authToken}`);

      ws.current.onopen = () => {
        setIsConnected(true);
        eventBus.emit('ws:connect', undefined);
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type && message.payload) {
            const notification: Notification = {
              id: `${message.type}-${Date.now()}`,
              type: message.type,
              title: message.payload.title || message.event,
              description: message.payload.description || message.payload.message || '',
              severity: message.payload.severity || message.payload.priority || 'info',
              timestamp: message.payload.timestamp || new Date().toISOString(),
              read: false,
              link: message.payload.link,
              data: message.payload,
            };
            setNotifications(prev => [notification, ...prev]);
            eventBus.emit('ws:message', {
              type: message.type,
              table: message.payload.table,
              action: message.payload.action,
              id: message.payload.id,
            });
          }
        } catch (err) {
          console.error('[WS] Message parse error:', err);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        eventBus.emit('ws:disconnect', undefined);
        reconnectTimeout.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = (err) => {
        console.error('[WS] Error:', err);
      };
    } catch (err) {
      console.error('[WS] Connection error:', err);
    }
  }, [authToken]);

  // Initialize
  useEffect(() => {
    loadNotifications();
    connect();
    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connect, loadNotifications]);

  const markAsRead = useCallback(async (id: string | number) => {
    try {
      await notificationsApi.markAsRead(String(id));
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('[Notifications] Mark as read failed:', err);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('[Notifications] Mark all as read failed:', err);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }, []);

  const dismissNotification = useCallback(async (id: string | number) => {
    try {
      await notificationsApi.delete(String(id));
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('[Notifications] Delete failed:', err);
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await notificationsApi.clearAll();
      setNotifications([]);
    } catch (err) {
      console.error('[Notifications] Clear all failed:', err);
      setNotifications([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    refresh,
  };
}
