# CortexBuild Ultimate - API Documentation

## Base URL
- Development: `http://localhost:3001/api`
- Production: `http://72.62.132.43:3001/api`

## Authentication

All endpoints require JWT Bearer token:
```
Authorization: Bearer <token>
```

## Endpoints

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List all projects |
| GET | `/projects/:id` | Get project by ID |
| POST | `/projects` | Create new project |
| PUT | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/documents` | List all documents |
| POST | `/documents/upload` | Upload document |
| GET | `/documents/:id/download` | Download document |

### Safety
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/safety` | List safety incidents |
| POST | `/safety` | Report incident |
| GET | `/safety/stats` | Get safety statistics |

## Response Format

### Success
```json
{
  "data": {},
  "message": "Success",
  "timestamp": "2026-04-01T12:00:00Z"
}
```

### Error
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Rate Limiting
- 100 requests per minute per API key
- 429 Too Many Requests when exceeded

## Export Endpoints

### PDF Export
```
GET /api/export/pdf?table=projects&format=pdf
```

### CSV Export
```
GET /api/export/csv?table=projects
```
