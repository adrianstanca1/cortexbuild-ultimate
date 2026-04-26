/**
 * Test: useCollaborativeEditor Hook (Real-time Collaboration)
 *
 * Tests WebSocket integration, presence updates, and remote operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCollaborativeEditor } from "@/hooks/useCollaborativeEditor";

// Mock global fetch for initial document load
global.fetch = vi.fn();

describe("useCollaborativeEditor (Real-time)", () => {
  let mockWS: WebSocket;
  let wsInstances: WebSocket[] = [];
  let lastWsInstance: WebSocket | null = null;

  beforeEach(() => {
    // Mock WebSocket
    const OriginalWS = global.WebSocket;
    global.WebSocket = class MockWebSocket {
      url: string;
      readyState = 0;
      onopen: ((this: WebSocket, ev: Event) => void) | null = null;
      onmessage: ((this: WebSocket, ev: MessageEvent) => void) | null = null;
      onerror: ((this: WebSocket, ev: Event) => void) | null = null;
      onclose: ((this: WebSocket, ev: CloseEvent) => void) | null = null;

      listeners: Record<string, Set<(e: Event) => void>> = {};

      constructor(url: string) {
        this.url = url;
        this.readyState = 0;
        wsInstances.push(this as unknown as WebSocket);
        lastWsInstance = this as unknown as WebSocket;
      }

      send = vi.fn((data: string) => {
        // Simulate server receiving
      });

      close = vi.fn(() => {
        this.readyState = 3;
        this.onclose?.(new CloseEvent("close"));
      });

      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      dispatchEvent = vi.fn();
    } as any;

    // Mock fetch for initial document load
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        content: "Initial content",
        versions: [],
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    wsInstances = [];
    lastWsInstance = null;
  });

  it("should connect to WebSocket on mount", async () => {
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    expect(result.current.connectionStatus).toBe("connecting");

    // Simulate WebSocket open
    await act(async () => {
      lastWsInstance!.readyState = 1;
      lastWsInstance!.onopen?.(new Event("open"));
      await new Promise((r) => setTimeout(r, 10));
    });

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe("connected");
    });
  });

  it("should send welcome message on connection", async () => {
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await act(async () => {
      lastWsInstance!.readyState = 1;
      lastWsInstance!.onopen?.(new Event("open"));

      // Simulate server sending welcome
      const welcomeMsg = {
        type: "welcome",
        clientId: "client-abc123",
        docId: "doc-123",
        presence: [],
        timestamp: Date.now(),
      };
      lastWsInstance!.onmessage?.(
        new MessageEvent("message", { data: JSON.stringify(welcomeMsg) })
      );

      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.presence).toEqual([]);
  });

  it("should receive and apply remote operations", async () => {
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await act(async () => {
      lastWsInstance!.readyState = 1;
      lastWsInstance!.onopen?.(new Event("open"));

      // Simulate welcome
      const welcomeMsg = {
        type: "welcome",
        clientId: "client-abc",
        docId: "doc-123",
        presence: [],
        timestamp: Date.now(),
      };
      lastWsInstance!.onmessage?.(
        new MessageEvent("message", { data: JSON.stringify(welcomeMsg) })
      );

      // Simulate remote operation
      const remoteOp = {
        type: "remote_op",
        op: { type: "insert", content: "hello", position: 0 },
        serverTimestamp: Date.now(),
        clientId: "client-xyz",
      };
      lastWsInstance!.onmessage?.(
        new MessageEvent("message", { data: JSON.stringify(remoteOp) })
      );

      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.content).toContain("hello");
  });

  it("should handle delete operations", async () => {
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await act(async () => {
      lastWsInstance!.readyState = 1;
      lastWsInstance!.onopen?.(new Event("open"));

      // Set initial content
      const welcomeMsg = {
        type: "welcome",
        clientId: "client-abc",
        docId: "doc-123",
        presence: [],
        timestamp: Date.now(),
      };
      lastWsInstance!.onmessage?.(
        new MessageEvent("message", { data: JSON.stringify(welcomeMsg) })
      );

      // Apply insert first
      const insertOp = {
        type: "remote_op",
        op: { type: "insert", content: "hello world", position: 0 },
        serverTimestamp: Date.now(),
        clientId: "client-xyz",
      };
      lastWsInstance!.onmessage?.(
        new MessageEvent("message", { data: JSON.stringify(insertOp) })
      );

      // Then delete 5 chars
      const deleteOp = {
        type: "remote_op",
        op: { type: "delete", position: 0, length: 5 },
        serverTimestamp: Date.now(),
        clientId: "client-xyz",
      };
      lastWsInstance!.onmessage?.(
        new MessageEvent("message", { data: JSON.stringify(deleteOp) })
      );

      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.content).toBe(" world");
  });

  it("should broadcast presence updates", async () => {
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await act(async () => {
      lastWsInstance!.readyState = 1;
      lastWsInstance!.onopen?.(new Event("open"));

      // Simulate presence update with multiple users
      const presenceMsg = {
        type: "presence_update",
        presence: [
          {
            clientId: "client-1",
            userId: "user-1",
            userName: "Alice",
            cursorPos: 10,
            idle: false,
          },
          {
            clientId: "client-2",
            userId: "user-2",
            userName: "Bob",
            cursorPos: 20,
            idle: false,
          },
        ],
        timestamp: Date.now(),
      };
      lastWsInstance!.onmessage?.(
        new MessageEvent("message", { data: JSON.stringify(presenceMsg) })
      );

      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.presence).toHaveLength(2);
    expect(result.current.presence[0].userName).toBe("Alice");
    expect(result.current.presence[1].userName).toBe("Bob");
    expect(result.current.collaborators).toEqual(result.current.presence);
  });

  it("should send operations via WebSocket", async () => {
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await act(async () => {
      lastWsInstance!.readyState = 1;
      lastWsInstance!.onopen?.(new Event("open"));

      // Wait a bit for connection to settle
      await new Promise((r) => setTimeout(r, 10));
    });

    // Update content
    act(() => {
      result.current.updateContent("new content");
    });

    // Should have sent operation
    expect(lastWsInstance!.send).toHaveBeenCalled();
    const sentData = JSON.parse(
      (lastWsInstance!.send as any).mock.calls[0][0]
    );
    expect(sentData.type).toBe("op");
    expect(sentData.op.content).toBe("new content");
  });

  it("should handle connection errors", async () => {
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await act(async () => {
      lastWsInstance!.readyState = 1;
      lastWsInstance!.onopen?.(new Event("open"));

      // Simulate error
      lastWsInstance!.onerror?.(new Event("error"));

      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.error?.message).toContain("WebSocket");
  });

  it("should handle disconnection", async () => {
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await act(async () => {
      lastWsInstance!.readyState = 1;
      lastWsInstance!.onopen?.(new Event("open"));

      expect(result.current.connectionStatus).toBe("connected");

      // Simulate close
      lastWsInstance!.readyState = 3;
      lastWsInstance!.onclose?.(new CloseEvent("close"));

      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.connectionStatus).toBe("disconnected");
  });

  it("should handle invalid messages gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await act(async () => {
      lastWsInstance!.readyState = 1;
      lastWsInstance!.onopen?.(new Event("open"));

      // Send invalid JSON
      lastWsInstance!.onmessage?.(
        new MessageEvent("message", { data: "{invalid json" })
      );

      await new Promise((r) => setTimeout(r, 10));
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should close WebSocket on unmount", async () => {
    const { unmount } = renderHook(() => useCollaborativeEditor("doc-123"));

    await act(async () => {
      lastWsInstance!.readyState = 1;
      lastWsInstance!.onopen?.(new Event("open"));
      await new Promise((r) => setTimeout(r, 10));
    });

    const closeSpy = vi.spyOn(lastWsInstance!, "close");

    unmount();

    expect(closeSpy).toHaveBeenCalled();
  });

  it("should send heartbeat ping periodically", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await act(async () => {
      lastWsInstance!.readyState = 1;
      lastWsInstance!.onopen?.(new Event("open"));
      await new Promise((r) => setTimeout(r, 10));
    });

    const sendSpy = vi.spyOn(lastWsInstance!, "send");

    // Advance time by 25 seconds
    act(() => {
      vi.advanceTimersByTime(25_000);
    });

    // Should have sent ping
    await waitFor(() => {
      const calls = sendSpy.mock.calls.filter(
        (call) =>
          call[0] &&
          JSON.parse(call[0]).type === "ping"
      );
      expect(calls.length).toBeGreaterThan(0);
    });

    vi.useRealTimers();
  });
});
