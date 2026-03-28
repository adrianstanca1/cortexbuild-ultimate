import { Request, Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
}

const clients: Map<string, SSEClient> = new Map();

export function addSSEClient(id: string, res: Response) {
  clients.set(id, { id, res });
}

export function removeSSEClient(id: string) {
  clients.delete(id);
}

export function broadcastSSE(event: string, data: unknown, targetIds?: string[]) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const targetClients = targetIds ? targetIds.map(id => clients.get(id)).filter(Boolean) : Array.from(clients.values());

  for (const client of targetClients) {
    if (client) {
      client.res.write(message);
    }
  }
}

export function sendSSE(req: Request, res: Response) {
  const clientId = (req.query.clientId as string) || req.ip || 'anonymous';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);

  addSSEClient(clientId, res);

  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeSSEClient(clientId);
  });
}

export interface SSENotification {
  type: 'task' | 'rfi' | 'daily_report' | 'safety' | 'project' | 'message';
  action: 'create' | 'update' | 'delete';
  entityId: string;
  projectId?: string;
  userId: string;
  data: Record<string, unknown>;
}

export function notifyProject(projectId: string, notification: SSENotification, targetUserIds?: string[]) {
  broadcastSSE('notification', notification, targetUserIds);
}

export function notifyOrganization(orgId: string, notification: SSENotification, targetUserIds?: string[]) {
  broadcastSSE('org_notification', notification, targetUserIds);
}
