import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotificationCenter } from '../hooks/useNotificationCenter';
import * as api from '../lib/api';

// Mock the API and WebSocket
vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

// Mock WebSocket
class MockWebSocket {
  readyState = WebSocket.CONNECTING;
  onopen: any = null;
  onmessage: any = null;
  onerror: any = null;
  onclose: any = null;
  close = vi.fn();
  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 0);
  }
}
(global as any).WebSocket = MockWebSocket;

describe('useNotificationCenter cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // Default API mock responses
    (api.apiGet as any).mockImplementation(() => Promise.resolve({
      notifications: [],
      unreadCount: 0,
      total: 0
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cleans up resources on unmount', async () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const abortSpy = vi.fn();
    class MockAbortController {
      abort = abortSpy;
      signal = { aborted: false };
    }
    (global as any).AbortController = MockAbortController;

    const { unmount } = renderHook(() => useNotificationCenter({ autoConnect: true }));

    unmount();

    // Verify cleanup
    expect(abortSpy).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('does not update state after unmount in fetchNotifications', async () => {
    let resolveApi: (value: any) => void;
    const apiPromise = new Promise((resolve) => {
      resolveApi = resolve;
    });

    (api.apiGet as any).mockReturnValue(apiPromise);

    const { unmount } = renderHook(() => useNotificationCenter());

    unmount();

    // Resolve the API call after unmount
    resolveApi!({
      notifications: [{ id: '1', title: 'Late Notif' }],
      unreadCount: 1,
      total: 1
    });
  });
});
