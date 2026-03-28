import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

interface UseNotificationsOptions {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

async function fetchNotifications(options: UseNotificationsOptions = {}): Promise<NotificationsResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.unreadOnly) params.set('unreadOnly', 'true');

  const response = await fetch(`/api/notifications?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  return response.json();
}

async function markAsRead(id: string): Promise<void> {
  const response = await fetch(`/api/notifications/${id}/read`, {
    method: 'PUT',
  });
  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }
}

async function markAllAsRead(): Promise<void> {
  const response = await fetch('/api/notifications/read-all', {
    method: 'PUT',
  });
  if (!response.ok) {
    throw new Error('Failed to mark all notifications as read');
  }
}

async function deleteNotification(id: string): Promise<void> {
  const response = await fetch(`/api/notifications/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete notification');
  }
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  return useQuery({
    queryKey: ['notifications', options],
    queryFn: () => fetchNotifications(options),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/unread-count');
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }
      return response.json();
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useRealtimeNotifications(enabled: boolean = true) {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (!enabled) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/notifications`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onclose = () => {
      setIsConnected(false);
      setTimeout(connect, 5000);
    };

    socket.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as Notification;
        queryClient.setQueryData<NotificationsResponse>(['notifications', {}], (old) => {
          if (!old) return old;
          return {
            ...old,
            notifications: [notification, ...old.notifications],
            unreadCount: old.unreadCount + 1,
            total: old.total + 1,
          };
        });
      } catch {
        console.error('Failed to parse notification');
      }
    };

    socket.onerror = () => {
      socket.close();
    };

    return () => {
      socket.close();
    };
  }, [enabled, queryClient]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (cleanup) cleanup();
    };
  }, [connect]);
}
