/**
 * CortexBuild Ultimate — WebSocket Server
 * Real-time notifications, live dashboard updates, collaborative features
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cortexbuild-secret-key';

// Message types
const MESSAGE_TYPES = {
  NOTIFICATION: 'notification',
  DASHBOARD_UPDATE: 'dashboard_update',
  ALERT: 'alert',
  COLLABORATION: 'collaboration',
  SYSTEM: 'system',
};

// Connection store
const clients = new Map(); // Map<userId, Set<WebSocket>>
const rooms = new Map();   // Map<roomId, Set<userId>>

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server to attach to
 */
function initWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('[WS] New connection');

    // Authenticate connection
    const token = extractToken(req.url);
    if (!token || !verifyToken(token)) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    const userId = decodeToken(token).id;
    const userRooms = new Set();

    // Register client
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId).add(ws);

    // Auto-join user's personal room
    userRooms.add(`user:${userId}`);
    joinRoom(userId, `user:${userId}`);

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, userId, message);
      } catch (err) {
        console.error('[WS] Message parse error:', err.message);
        sendError(ws, 'Invalid message format');
      }
    });

    // Handle connection close
    ws.on('close', () => {
      console.log('[WS] Connection closed');
      clients.get(userId)?.delete(ws);
      if (clients.get(userId)?.size === 0) {
        clients.delete(userId);
      }
      // Leave all rooms
      userRooms.forEach(room => leaveRoom(userId, room));
    });

    // Send welcome message
    sendToClient(ws, {
      type: MESSAGE_TYPES.SYSTEM,
      event: 'connected',
      payload: {
        message: 'Connected to CortexBuild real-time service',
        timestamp: new Date().toISOString(),
      },
    });
  });

  console.log('[WS] WebSocket server initialized on /ws');
  return wss;
}

/**
 * Extract JWT token from WebSocket URL query string
 */
function extractToken(url) {
  const urlObj = new URL(url, 'ws://localhost');
  return urlObj.searchParams.get('token');
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (err) {
    console.error('[WS] Token verification failed');
    return false;
  }
}

/**
 * Decode JWT token
 */
function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * Send message to specific client
 */
function sendToClient(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Send message to all clients of a user
 */
function sendToUser(userId, message) {
  const userClients = clients.get(userId);
  if (userClients) {
    userClients.forEach(ws => sendToClient(ws, message));
  }
}

/**
 * Send message to room
 */
function sendToRoom(roomId, message, excludeUserId = null) {
  const room = rooms.get(roomId);
  if (room) {
    room.forEach(userId => {
      if (userId !== excludeUserId) {
        sendToUser(userId, message);
      }
    });
  }
}

/**
 * Broadcast to all connected clients
 */
function broadcast(message) {
  clients.forEach((userClients, userId) => {
    userClients.forEach(ws => sendToClient(ws, message));
  });
}

/**
 * Join room
 */
function joinRoom(userId, roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId).add(userId);
}

/**
 * Leave room
 */
function leaveRoom(userId, roomId) {
  const room = rooms.get(roomId);
  if (room) {
    room.delete(userId);
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  }
}

/**
 * Handle incoming message
 */
function handleMessage(ws, userId, message) {
  const { type, event, payload, room } = message;

  switch (event) {
    case 'join_room':
      joinRoom(userId, payload.room);
      sendToClient(ws, {
        type: MESSAGE_TYPES.SYSTEM,
        event: 'room_joined',
        payload: { room: payload.room },
      });
      break;

    case 'leave_room':
      leaveRoom(userId, payload.room);
      sendToClient(ws, {
        type: MESSAGE_TYPES.SYSTEM,
        event: 'room_left',
        payload: { room: payload.room },
      });
      break;

    case 'send_notification':
      // Send notification to specific user or room
      if (payload.userId) {
        sendToUser(payload.userId, {
          type: MESSAGE_TYPES.NOTIFICATION,
          event: 'notification',
          payload: {
            from: userId,
            ...payload.data,
            timestamp: new Date().toISOString(),
          },
        });
      } else if (payload.room) {
        sendToRoom(payload.room, {
          type: MESSAGE_TYPES.NOTIFICATION,
          event: 'notification',
          payload: {
            from: userId,
            ...payload.data,
            timestamp: new Date().toISOString(),
          },
        });
      }
      break;

    case 'broadcast':
      broadcast({
        type: MESSAGE_TYPES.SYSTEM,
        event: 'broadcast',
        payload: {
          from: userId,
          ...payload,
          timestamp: new Date().toISOString(),
        },
      });
      break;

    default:
      sendError(ws, `Unknown event: ${event}`);
  }
}

/**
 * Send error message
 */
function sendError(ws, errorMessage) {
  sendToClient(ws, {
    type: MESSAGE_TYPES.SYSTEM,
    event: 'error',
    payload: { message: errorMessage },
  });
}

/**
 * Create notification helper
 */
function createNotification(userId, title, description, severity = 'info', data = {}) {
  sendToUser(userId, {
    type: MESSAGE_TYPES.NOTIFICATION,
    event: 'notification',
    payload: {
      title,
      description,
      severity,
      ...data,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Create alert helper (high priority notification)
 */
function createAlert(userId, title, description, data = {}) {
  sendToUser(userId, {
    type: MESSAGE_TYPES.ALERT,
    event: 'alert',
    payload: {
      title,
      description,
      priority: 'high',
      ...data,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Dashboard update helper
 */
function sendDashboardUpdate(userId, updates) {
  sendToUser(userId, {
    type: MESSAGE_TYPES.DASHBOARD_UPDATE,
    event: 'dashboard_update',
    payload: {
      updates,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Project room helpers
 */
function createProjectRoom(projectId, userId) {
  joinRoom(userId, `project:${projectId}`);
}

function notifyProjectTeam(projectId, title, description, excludeUserId = null) {
  sendToRoom(`project:${projectId}`, {
    type: MESSAGE_TYPES.COLLABORATION,
    event: 'project_notification',
    payload: {
      projectId,
      title,
      description,
      timestamp: new Date().toISOString(),
    },
  }, excludeUserId);
}

// Export for use in routes
module.exports = {
  initWebSocket,
  createNotification,
  createAlert,
  sendDashboardUpdate,
  createProjectRoom,
  notifyProjectTeam,
  broadcast,
  MESSAGE_TYPES,
};
