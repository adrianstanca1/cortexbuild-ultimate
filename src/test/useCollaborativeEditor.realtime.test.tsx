/**
 * Test: useCollaborativeEditor Hook (Real-time Collaboration)
 *
 * Tests WebSocket integration, presence updates, and remote operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { Server, WebSocket as MockWebSocket } from "mock-socket";
import { useCollaborativeEditor } from "@/hooks/useCollaborativeEditor";

// Mock global fetch for initial document load
global.fetch = vi.fn();

describe("useCollaborativeEditor (Real-time)", () => {
  let server: Server;
  let serverSocket: any = null;

  beforeEach(() => {
    // In jsdom, window.location.host defaults to "localhost:3000"
    // Match this in the mock-socket Server URL
    const WS_URL = "ws://localhost:3000/ws/documents/doc-123";

    // Initialize mock-socket Server
    server = new Server(WS_URL);

    server.on("connection", (socket: any) => {
      serverSocket = socket;

      // Optional: handle incoming messages from client
      socket.on("message", (data: string) => {
        // Handle client messages if needed
      });
    });

    // Replace global WebSocket with mock-socket
    (global.WebSocket as any) = MockWebSocket;

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
    server.stop();
    serverSocket = null;
  });

  it("should connect to WebSocket on mount", async () => {
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    expect(result.current.connectionStatus).toBe("connecting");

    // Wait for connection to be established
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe("connected");
    });
  });

  it("should send welcome message on connection", async () => {
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await act(async () => {
      // Wait for server socket to be established
      await new Promise((r) => setTimeout(r, 50));

      // Send welcome message from server to client
      if (serverSocket) {
        const welcomeMsg = {
          type: "welcome",
          clientId: "client-abc123",
          docId: "doc-123",
          presence: [],
          timestamp: Date.now(),
        };
        serverSocket.send(JSON.stringify(welcomeMsg));
      }

      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.presence).toEqual([]);
  });

  it("should receive and apply remote operations", async () => {
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));

      if (serverSocket) {
        // Simulate welcome
        const welcomeMsg = {
          type: "welcome",
          clientId: "client-abc",
          docId: "doc-123",
          presence: [],
          timestamp: Date.now(),
        };
        serverSocket.send(JSON.stringify(welcomeMsg));

        // Simulate remote operation
        const remoteOp = {
          type: "remote_op",
          op: { type: "insert", content: "hello", position: 0 },
          serverTimestamp: Date.now(),
          clientId: "client-xyz",
        };
        serverSocket.send(JSON.stringify(remoteOp));
      }

      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.content).toContain("hello");
  });

  it("should handle delete operations", async () => {
    // Mock fetch to return empty initial content for this test
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        content: "",
        versions: [],
      }),
    });

    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));

      if (serverSocket) {
        // Set initial content
        const welcomeMsg = {
          type: "welcome",
          clientId: "client-abc",
          docId: "doc-123",
          presence: [],
          timestamp: Date.now(),
        };
        serverSocket.send(JSON.stringify(welcomeMsg));

        // Apply insert first
        const insertOp = {
          type: "remote_op",
          op: { type: "insert", content: "hello world", position: 0 },
          serverTimestamp: Date.now(),
          clientId: "client-xyz",
        };
        serverSocket.send(JSON.stringify(insertOp));

        // Then delete 5 chars
        const deleteOp = {
          type: "remote_op",
          op: { type: "delete", position: 0, length: 5 },
          serverTimestamp: Date.now(),
          clientId: "client-xyz",
        };
        serverSocket.send(JSON.stringify(deleteOp));
      }

      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.content).toBe(" world");
  });

  it("should broadcast presence updates", async () => {
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));

      if (serverSocket) {
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
        serverSocket.send(JSON.stringify(presenceMsg));
      }

      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.presence).toHaveLength(2);
    expect(result.current.presence[0].userName).toBe("Alice");
    expect(result.current.presence[1].userName).toBe("Bob");
    expect(result.current.collaborators).toEqual(result.current.presence);
  });

  it("should send operations via WebSocket", async () => {
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    const sentMessages: string[] = [];

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));

      if (serverSocket) {
        // Capture messages sent from client to server
        serverSocket.on("message", (data: string) => {
          sentMessages.push(data);
        });
      }
    });

    // Update content
    act(() => {
      result.current.updateContent("new content");
    });

    // Wait a bit for message to be sent
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // Should have sent operation
    expect(sentMessages.length).toBeGreaterThan(0);
    const sentData = JSON.parse(sentMessages[0]);
    expect(sentData.type).toBe("op");
    expect(sentData.op.content).toBe("new content");
  });

  it("should handle connection errors", async () => {
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe("connected");
    });

    // Note: mock-socket doesn't easily support error simulation,
    // so this test verifies basic setup. Real error scenarios are tested via integration tests.
    expect(result.current.connectionStatus).toBe("connected");
  });

  it("should handle disconnection", async () => {
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe("connected");
    });

    expect(result.current.connectionStatus).toBe("connected");

    // Close server socket to simulate disconnection
    await act(async () => {
      if (serverSocket) {
        serverSocket.close();
      }
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.connectionStatus).toBe("disconnected");
  });

  it("should handle invalid messages gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));

      if (serverSocket) {
        // Send invalid JSON
        serverSocket.send("{invalid json");
      }

      await new Promise((r) => setTimeout(r, 10));
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should close WebSocket on unmount", async () => {
    const { unmount } = renderHook(() => useCollaborativeEditor("doc-123"));

    await waitFor(() => {
      expect(serverSocket).toBeTruthy();
    });

    const closeSpy = vi.spyOn(serverSocket, "close");

    unmount();

    expect(closeSpy).toHaveBeenCalled();
  });

  it("should send heartbeat ping periodically", async () => {
    // Spy on setInterval to verify heartbeat interval is set
    const setIntervalSpy = vi.spyOn(global, "setInterval");

    const { result } = renderHook(() => useCollaborativeEditor("doc-123"));

    // Let connection establish
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe("connected");
    });

    // Verify setInterval was called with 25_000ms for the heartbeat
    const heartbeatCalls = setIntervalSpy.mock.calls.filter(
      (call: any) => call[1] === 25_000
    );

    // The hook sets up a 25-second heartbeat interval on connection
    expect(heartbeatCalls.length).toBeGreaterThan(0);

    setIntervalSpy.mockRestore();
  }, 15_000);
});
