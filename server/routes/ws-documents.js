/**
 * WebSocket Route: Real-time Document Collaboration
 *
 * Handles WebSocket upgrade for `/ws/documents/:id` paths.
 * - Validates JWT from httpOnly cookie
 * - Creates in-memory document rooms
 * - Relays operations (ops) with last-write-wins ordering
 * - Broadcasts presence (cursor positions, user list)
 *
 * Protocol:
 * Client → Server:
 *   { type: "op", op: { ... }, cursorPos: number }
 *   { type: "presence", cursorPos: number }
 *
 * Server → Client:
 *   { type: "remote_op", op, serverTimestamp, clientId }
 *   { type: "presence_update", presence: [...], timestamp }
 *   { type: "error", message }
 */

const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const {
  DocumentRoomManager,
  PRESENCE_HEARTBEAT_INTERVAL,
} = require("../lib/realtime/document-rooms");

const JWT_SECRET = process.env.JWT_SECRET;

// Global room manager instance
const roomManager = new DocumentRoomManager();

/**
 * Attach WebSocket server for document collaboration.
 * Called from server/index.js with the HTTP server instance.
 *
 * @param {http.Server} server - Express HTTP server
 */
function attachDocumentWS(server) {
  const wss = new WebSocket.Server({ noServer: true });

  /**
   * Upgrade handler: matches paths like /ws/documents/:id
   */
  server.on("upgrade", (req, socket, head) => {
    if (!req.url.startsWith("/ws/documents/")) {
      return; // Not our route; let other handlers process
    }

    // Extract document ID from URL
    const match = req.url.match(/^\/ws\/documents\/([^/?]+)/);
    if (!match) {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
      socket.destroy();
      return;
    }
    const docId = match[1];

    // Validate JWT from httpOnly cookie
    const token = extractTokenFromCookie(req.headers.cookie);
    if (!token || !verifyToken(token)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    const decoded = decodeToken(token);
    if (!decoded) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    // Upgrade to WebSocket
    wss.handleUpgrade(req, socket, head, (ws) => {
      handleConnection(ws, { docId, userId: decoded.id, userName: decoded.name || "Anonymous" });
    });
  });

  // Periodic cleanup of empty rooms
  const cleanupInterval = setInterval(() => {
    roomManager.cleanup();
  }, 60_000); // Every minute

  // Export cleanup for graceful shutdown
  return {
    wss,
    cleanup: () => {
      clearInterval(cleanupInterval);
      wss.clients.forEach((ws) => ws.close());
    },
  };
}

/**
 * Handle a new WebSocket connection.
 * @param {WebSocket} ws
 * @param {object} metadata - { docId, userId, userName }
 */
function handleConnection(ws, metadata) {
  const { docId, userId, userName } = metadata;
  const clientId = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  console.log(`[DocumentWS] Client ${clientId} joining doc ${docId}`);

  const room = roomManager.getRoom(docId);
  room.addClient(clientId, ws, { userId, userName });

  // Send welcome message with client ID and current presence
  ws.send(JSON.stringify({
    type: "welcome",
    clientId,
    docId,
    presence: room.getPresenceList(),
    timestamp: Date.now(),
  }));

  // Send presence update to other clients
  room._broadcastPresenceList?.();

  // Handle incoming messages
  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(room, clientId, message);
    } catch (err) {
      console.error(`[DocumentWS ${docId}] Parse error:`, err.message);
      sendError(ws, "Invalid message format");
    }
  });

  // Handle disconnect
  ws.on("close", () => {
    console.log(`[DocumentWS] Client ${clientId} left doc ${docId}`);
    room.removeClient(clientId);
    room._broadcastPresenceList?.();
  });

  // Handle errors
  ws.on("error", (err) => {
    console.error(`[DocumentWS ${docId}] Connection error:`, err.message);
  });

  // Heartbeat: periodically ask client to ping
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(heartbeat);
    }
  }, PRESENCE_HEARTBEAT_INTERVAL);

  ws.on("close", () => clearInterval(heartbeat));
}

/**
 * Handle incoming WebSocket message.
 * @param {DocumentRoom} room
 * @param {string} clientId
 * @param {object} message
 */
function handleMessage(room, clientId, message) {
  const { type } = message;

  switch (type) {
    case "op": {
      // Relay operation to other clients
      // clientId is omitted from the broadcast; receiver reconstructs from sender
      room.broadcastOp({
        clientId,
        op: message.op || {},
        serverTimestamp: Date.now(),
      });

      // Update client presence if cursor position included
      if (message.cursorPos !== undefined) {
        room.updatePresence(clientId, { cursorPos: message.cursorPos });
      }
      break;
    }

    case "presence": {
      // Update presence (cursor position)
      room.updatePresence(clientId, message);
      break;
    }

    case "ping": {
      // Client heartbeat — reset idle timer
      const client = room.clients.get(clientId);
      if (client) {
        client.lastSeen = Date.now();
        room._resetPresenceTimer?.(clientId);
      }
      break;
    }

    default: {
      console.warn(`[DocumentWS] Unknown message type: ${type}`);
      sendError(room.clients.get(clientId)?.ws, `Unknown message type: ${type}`);
    }
  }
}

/**
 * Extract JWT token from Cookie header.
 * @param {string} cookieHeader
 * @returns {string|null}
 */
function extractTokenFromCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? match[1] : null;
}

/**
 * Verify JWT token.
 * @param {string} token
 * @returns {boolean}
 */
function verifyToken(token) {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (err) {
    console.error("[DocumentWS] Token verification failed:", err.message);
    return false;
  }
}

/**
 * Decode JWT token.
 * @param {string} token
 * @returns {object|null}
 */
function decodeToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error("[DocumentWS] Token decode error:", err.message);
    return null;
  }
}

/**
 * Send error message to client.
 * @param {WebSocket} ws
 * @param {string} message
 */
function sendError(ws, message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "error", message }));
  }
}

module.exports = {
  attachDocumentWS,
};
