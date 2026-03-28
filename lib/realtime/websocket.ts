import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

interface WSClient {
  id: string;
  ws: WebSocket;
  userId?: string;
  organizationId?: string;
  projectIds: string[];
}

const clients: Map<string, WSClient> = new Map();

let wss: WebSocketServer | null = null;

export function initWebSocket(server: unknown) {
  if (!server) {
    console.warn('WebSocket server: No HTTP server provided');
    return null;
  }

  wss = new WebSocketServer({ server: server as any, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const clientId = req.url?.split('?clientId=')[1] || `ws_${Date.now()}`;

    const client: WSClient = {
      id: clientId,
      ws,
      projectIds: [],
    };

    clients.set(clientId, client);

    ws.send(JSON.stringify({ type: 'connected', clientId }));

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleWSMessage(clientId, message);
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      clients.delete(clientId);
    });
  });

  return wss;
}

function handleWSMessage(clientId: string, message: { type: string; [key: string]: unknown }) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case 'auth':
      client.userId = message.userId as string;
      client.organizationId = message.organizationId as string;
      client.ws.send(JSON.stringify({ type: 'authenticated', userId: client.userId }));
      break;

    case 'subscribe_project':
      const projectId = message.projectId as string;
      if (!client.projectIds.includes(projectId)) {
        client.projectIds.push(projectId);
      }
      client.ws.send(JSON.stringify({ type: 'subscribed', projectId }));
      break;

    case 'unsubscribe_project':
      const pidx = client.projectIds.indexOf(message.projectId as string);
      if (pidx > -1) {
        client.projectIds.splice(pidx, 1);
      }
      break;

    default:
      client.ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${message.type}` }));
  }
}

export function broadcastWS(event: string, data: unknown, targetClientIds?: string[]) {
  const message = JSON.stringify({ type: event, data, timestamp: Date.now() });
  const targets = targetClientIds ? targetClientIds.map(id => clients.get(id)).filter(Boolean) : Array.from(clients.values());

  for (const client of targets) {
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

export function sendToClient(clientId: string, event: string, data: unknown) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify({ type: event, data, timestamp: Date.now() }));
  }
}

export function broadcastToProject(projectId: string, event: string, data: unknown) {
  const message = JSON.stringify({ type: event, data, timestamp: Date.now() });

  for (const client of clients.values()) {
    if (client.projectIds.includes(projectId) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

export function broadcastToOrganization(orgId: string, event: string, data: unknown) {
  const message = JSON.stringify({ type: event, data, timestamp: Date.now() });

  for (const client of clients.values()) {
    if (client.organizationId === orgId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

export function closeWebSocket() {
  if (wss) {
    wss.close();
    wss = null;
  }
}

export function getConnectedClients() {
  return Array.from(clients.values()).map(c => ({
    id: c.id,
    userId: c.userId,
    organizationId: c.organizationId,
    projectIds: c.projectIds,
  }));
}
