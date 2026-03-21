/**
 * CortexBuild Ultimate — WebSocket Notifications Hook
 * Real-time notifications, dashboard updates, and alerts
 */
import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = (() => {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
})();

type Notification = {
  id: string;
  type: 'notification' | 'alert' | 'dashboard_update' | 'collaboration' | 'system';
  title: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'error' | 'critical';
  timestamp: string;
  read: boolean;
  data?: Record<string, unknown>;
};

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

export function useNotifications(authToken: string | null): UseNotificationsReturn {
  const ws = useRef<WebSocket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!authToken) return;

    try {
      ws.current = new WebSocket(`${WS_URL}?token=${authToken}`);

      ws.current.onopen = () => {
        console.log('[WS] Connected');
        setIsConnected(true);
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
              data: message.payload,
            };
            setNotifications(prev => [notification, ...prev]);
          }
        } catch (err) {
          console.error('[WS] Message parse error:', err);
        }
      };

      ws.current.onclose = () => {
        console.log('[WS] Disconnected');
        setIsConnected(false);
        // Attempt reconnection
        reconnectTimeout.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = (err) => {
        console.error('[WS] Error:', err);
      };
    } catch (err) {
      console.error('[WS] Connection error:', err);
    }
  }, [authToken]);

  // Disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connect]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
  };
}
