import React, { useEffect, useState } from 'react';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

interface WebSocketStatusProps {
  url?: string;
  onStatusChange?: (status: ConnectionStatus) => void;
}

export function WebSocketStatus({ url = '/ws', onStatusChange }: WebSocketStatusProps) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}${url}`;

      setStatus('connecting');
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setStatus('connected');
        onStatusChange?.('connected');
      };

      socket.onclose = () => {
        setStatus('disconnected');
        onStatusChange?.('disconnected');
        reconnectTimeout = setTimeout(connect, 5000);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      socket?.close();
    };
  }, [url, onStatusChange]);

  const statusConfig: Record<ConnectionStatus, { color: string; label: string; dotColor: string }> = {
    connected: {
      color: 'bg-green-500',
      label: 'Connected',
      dotColor: 'bg-green-400',
    },
    connecting: {
      color: 'bg-yellow-500',
      label: 'Connecting...',
      dotColor: 'bg-yellow-400 animate-pulse',
    },
    disconnected: {
      color: 'bg-red-500',
      label: 'Disconnected',
      dotColor: 'bg-red-400',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
      <span className="text-xs text-gray-600">{config.label}</span>
    </div>
  );
}
