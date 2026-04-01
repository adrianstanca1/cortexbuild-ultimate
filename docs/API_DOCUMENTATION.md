# CortexBuild Ultimate - API Documentation

**Version:** 3.0.0  
**Base URL:** `https://www.cortexbuildpro.com/api`  
**WebSocket:** `wss://www.cortexbuildpro.com/ws`

---

## Authentication

All API requests require JWT authentication.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Token Acquisition
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

---

## Core Endpoints

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List all projects |
| GET | `/projects/:id` | Get project by ID |
| POST | `/projects` | Create new project |
| PUT | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |

**Example:**
```bash
GET /api/projects

Response:
{
  "data": [
    {
      "id": "1",
      "name": "Project Alpha",
      "status": "active",
      "budget": 1000000,
      ...
    }
  ]
}
```

### Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/team` | List team members |
| GET | `/team/:id` | Get team member |
| POST | `/team` | Add team member |
| PUT | `/team/:id` | Update member |
| DELETE | `/team/:id` | Remove member |

### Safety

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/safety` | List safety incidents |
| POST | `/safety` | Report incident |
| PUT | `/safety/:id` | Update incident |

---

## New Feature Endpoints

### Notifications

#### Get Notifications
```bash
GET /api/notifications?page=1&pageSize=20&unreadOnly=true

Response:
{
  "notifications": [...],
  "unreadCount": 5,
  "total": 50
}
```

#### Mark as Read
```bash
PUT /api/notifications/:id/read

Response:
{
  "success": true
}
```

#### Mark All as Read
```bash
PUT /api/notifications/read-all

Response:
{
  "success": true
}
```

#### Get Unread Count
```bash
GET /api/notifications/unread-count

Response:
{
  "unreadCount": 5
}
```

### Analytics

#### Get Dashboard Overview
```bash
GET /api/dashboard-data/overview

Response:
{
  "kpi": {
    "activeProjects": 24,
    "totalRevenue": 2450000,
    "outstanding": 350000,
    "openRfis": 12,
    "hsScore": 95,
    "workforce": 156
  }
}
```

#### Get Revenue Data
```bash
GET /api/dashboard-data/revenue

Response:
[
  { "month": "Jan", "revenue": 180000 },
  { "month": "Feb", "revenue": 220000 },
  ...
]
```

#### Get Project Status
```bash
GET /api/dashboard-data/project-status

Response:
{
  "statuses": [
    { "name": "Active", "value": 12, "fill": "#10b981" },
    { "name": "Planning", "value": 5, "fill": "#3b82f6" },
    ...
  ]
}
```

### Activity Feed

#### Get Recent Activity
```bash
GET /api/activity-feed?limit=10

Response:
[
  {
    "id": "1",
    "type": "update",
    "userId": "user1",
    "userName": "Sarah Chen",
    "action": "updated",
    "target": "project timeline",
    "timestamp": "2026-04-01T12:00:00Z"
  },
  ...
]
```

### Calendar Events

#### Get Calendar Events
```bash
GET /api/calendar?month=2026-04

Response:
[
  {
    "id": "1",
    "title": "Site Inspection",
    "type": "inspection",
    "start": "2026-04-02T09:00:00Z",
    "end": "2026-04-02T11:00:00Z",
    "location": "Site A",
    "attendees": ["James Miller", "Sarah Chen"],
    "color": "#F59E0B"
  },
  ...
]
```

---

## WebSocket API

### Connection

```typescript
const ws = new WebSocket('wss://www.cortexbuildpro.com/ws?token=<jwt_token>');
```

### Message Types

#### Notification
```json
{
  "type": "notification",
  "event": "notification",
  "payload": {
    "title": "New Task Assigned",
    "description": "You have been assigned to Task #123",
    "severity": "info",
    "timestamp": "2026-04-01T12:00:00Z"
  }
}
```

#### Dashboard Update
```json
{
  "type": "dashboard_update",
  "event": "dashboard_update",
  "payload": {
    "updates": {
      "kpi": { ... },
      "projects": [...]
    },
    "timestamp": "2026-04-01T12:00:00Z"
  }
}
```

#### Alert
```json
{
  "type": "alert",
  "event": "alert",
  "payload": {
    "title": "Safety Alert",
    "description": "High wind speed detected",
    "priority": "high",
    "timestamp": "2026-04-01T12:00:00Z"
  }
}
```

### Sending Messages

#### Join Room
```json
{
  "event": "join_room",
  "payload": {
    "room": "project:123"
  }
}
```

#### Send Notification
```json
{
  "event": "send_notification",
  "payload": {
    "userId": "user123",
    "data": {
      "title": "Meeting Reminder",
      "description": "Meeting starts in 15 minutes"
    }
  }
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Server Error |

---

## Rate Limiting

- **Standard:** 100 requests per 15 minutes
- **WebSocket:** 1000 messages per minute
- **Export endpoints:** 10 requests per hour

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1617235200
```

---

## Export Endpoints

### PDF Export
```bash
POST /api/export/pdf
Content-Type: application/json

{
  "title": "Project Report",
  "sections": [
    {
      "type": "text",
      "data": "Project summary text..."
    },
    {
      "type": "table",
      "data": {
        "columns": ["Name", "Status", "Budget"],
        "rows": [["Project A", "Active", 1000000]]
      }
    }
  ]
}

Response: Binary PDF file
```

### CSV Export
```bash
GET /api/export/csv?table=projects

Response: CSV file download
```

---

## SDK Examples

### JavaScript/TypeScript
```typescript
import { apiGet, apiPost } from './lib/api';

// Get notifications
const notifications = await apiGet('/notifications');

// Mark as read
await apiPut(`/notifications/${id}/read`);

// WebSocket connection
const ws = new WebSocket(`ws://localhost:3001/ws?token=${token}`);
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'notification') {
    // Handle notification
  }
};
```

### cURL
```bash
# Get projects
curl -H "Authorization: Bearer $TOKEN" \
  https://www.cortexbuildpro.com/api/projects

# Create notification preference
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": true, "push": true}' \
  https://www.cortexbuildpro.com/api/notifications/preferences
```

---

## Webhooks

Configure webhooks to receive real-time updates:

```bash
POST /api/webhooks
{
  "url": "https://your-server.com/webhook",
  "events": ["notification", "alert", "dashboard_update"],
  "secret": "your-webhook-secret"
}
```

---

*Last updated: 2026-04-01*
