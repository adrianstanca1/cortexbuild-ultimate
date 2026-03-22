# CortexBuild Ultimate

**AI-Powered Unified Construction Management Platform** — Dark theme industrial intelligence aesthetic with Express.js backend.

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + PostgreSQL + JWT auth
- **Design System**: Custom CSS variables (--slate-*, --amber-*, --emerald-*, --red-*)
- **Real-time**: WebSocket for notifications
- **PWA**: Offline support, installable app

## Quick Start

### 1. Install dependencies

```bash
# Frontend
npm install

# Backend
cd server && npm install && cd ..
```

### 2. Configure environment

```bash
# Copy and edit .env.local
cp .env.example .env.local
```

Required variables:
- `VITE_API_BASE_URL=http://localhost:3001`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=your-secret-key`

### 3. Run database migrations

```bash
psql -d cortexbuild -f server/migrations/001_add_audit_log.sql
psql -d cortexbuild -f server/migrations/002_add_email_tables.sql
psql -d cortexbuild -f server/migrations/003_add_report_templates.sql
psql -d cortexbuild -f server/migrations/004_add_permissions.sql
```

### 4. Start the backend

```bash
pm2 start server/index.js --name cortexbuild-api
```

Server runs on `http://localhost:3001`

### 5. Start the frontend

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm run test         # Run tests
npm run test:watch   # Watch mode for tests
npm run test:coverage # Coverage report
```

## Modules

### Core Management
- **Dashboard** — Site Command Center with health radar, weather, AI insights
- **Projects** — Project tracking with progress, budget, workforce
- **Invoicing** — Invoice management with revenue tracking
- **Accounting** — Financial management
- **Financial Reports** — Summary, Project Costs, Cash Flow, P&L reports

### Operations
- **Safety** — HSE Intelligence Hub with risk analytics, RIDDOR reporting
- **Teams** — Workforce management with availability tracking
- **Timesheets** — Hours tracking
- **Subcontractors** — Subcontractor management with CIS verification
- **Plant** — Equipment management
- **Materials** — Materials tracking & procurement
- **Daily Reports** — Site diaries

### Quality & Compliance
- **RAMS** — Risk Assessment & Method Statements (UK compliance)
- **CIS** — Construction Industry Scheme returns (UK)
- **Inspections** — QA inspections
- **Risk Register** — Risk management
- **Punch List** — Snagging / defect tracking
- **RFIs** — Requests for Information
- **Change Orders** — Variation management

### Collaboration
- **Documents** — Document control with drag-drop upload
- **Meetings** — Meeting management with action items
- **Drawings** — Plan management
- **Calendar** — Monthly view of projects, meetings, deadlines
- **CRM** — Client management with deals pipeline

### Intelligence
- **AI Assistant** — 8 specialized agents with streaming UI
- **Analytics** — Business intelligence dashboards
- **Tenders** — Bids & proposals with AI scoring
- **Executive Reports** — C-Suite dashboards
- **Predictive Analytics** — AI-powered forecasting

### Advanced Features
- **Global Search** — Search across all modules (Ctrl+K)
- **Audit Log** — Track all data changes
- **Email Notifications** — Send, schedule, track emails
- **Report Templates** — Save & reuse report configurations
- **Permissions Manager** — RBAC with custom roles
- **Bulk Actions** — Multi-select operations
- **Export/Import** — CSV, JSON data export/import
- **Offline Support** — PWA with offline caching

## Design Features

- **Dark theme** with slate/amber/emerald color palette
- **Industrial command center** aesthetic
- **Responsive** — Mobile nav bar, adaptive layouts
- **Keyboard shortcuts** — Ctrl+1-4 navigation, Shift+? help
- **Recharts** for data visualization
- **Real-time notifications** via WebSocket

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+1 | Go to Dashboard |
| Ctrl+2 | Go to Projects |
| Ctrl+3 | Go to Invoicing |
| Ctrl+4 | Go to Safety |
| Ctrl+K | Global Search |
| Ctrl+B | Toggle Sidebar |
| Shift+? | Show Shortcuts |

## API Endpoints

Base URL: `http://localhost:3001`

### Authentication
- `POST /api/auth/login` — Authenticate
- `POST /api/auth/register` — Register

### CRUD Operations
- `GET /api/:table` — List records (JWT required)
- `POST /api/:table` — Create record (JWT required)
- `PUT /api/:table/:id` — Update record (JWT required)
- `DELETE /api/:table/:id` — Delete record (JWT required)

### Advanced APIs
- `GET /api/financial-reports/summary` — Financial summary
- `GET /api/financial-reports/cashflow` — Cash flow data
- `GET /api/search?q=` — Global search
- `GET /api/calendar` — Calendar events
- `GET /api/audit` — Audit log
- `POST /api/email/send` — Send email
- `POST /api/email/bulk` — Bulk email
- `GET /api/report-templates` — Report templates
- `GET /api/permissions/roles` — Role permissions
- `POST /api/upload` — File upload

## Database Tables

| Table | Description |
|-------|-------------|
| `projects` | Project information |
| `invoices` | Invoice records |
| `safety_incidents` | Safety reports |
| `rfis` | Requests for Information |
| `change_orders` | Variation orders |
| `team_members` | Staff records |
| `equipment` | Plant & equipment |
| `subcontractors` | Subcontractor data |
| `documents` | Document metadata |
| `timesheets` | Hours tracking |
| `email_logs` | Email history |
| `scheduled_emails` | Scheduled emails |
| `email_preferences` | User email settings |
| `report_templates` | Saved templates |
| `custom_roles` | Custom RBAC roles |
| `audit_log` | Change tracking |

## Security

- JWT authentication on all API routes
- Role-based access control (RBAC)
- Column whitelisting for SQL injection prevention
- XSS protection in email templates
- Rate limiting on email endpoints
- Authorization checks on sensitive routes

## Build

```bash
npm run build
```

Output in `dist/` directory.

## Deployment

### Frontend (Vercel)

```bash
vercel deploy --prod
```

### Backend (PM2)

```bash
pm2 start server/index.js --name cortexbuild-api
pm2 save
```

## License

© 2026 CortexBuild Ltd. UK Construction Management Platform.
