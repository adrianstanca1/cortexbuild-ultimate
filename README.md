# CortexBuild Ultimate

**AI-Powered Unified Construction Management Platform** — Enterprise-grade construction management SaaS

[![Platform Health](https://img.shields.io/badge/Platform%20Health-100%2F100-success)](docs/100_100_ACHIEVEMENT.md)
[![Tests](https://img.shields.io/badge/Tests-121%2F121%20passing-success)](docs/CODE_REVIEW_REPORT.md)
[![Version](https://img.shields.io/badge/Version-3.0.0-blue)](CHANGELOG.md)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success)](docs/ACCESSIBILITY_AUDIT.md)
[![License](https://img.shields.io/badge/License-Private-blue)](LICENSE)

## 🚀 Quick Links

- **[Documentation Index](docs/README.md)** - Complete documentation
- **[New Features Guide](docs/NEW_FEATURES_GUIDE.md)** - v3.0.0 features
- **[API Documentation](docs/API_DOCUMENTATION.md)** - API reference
- **[Deployment Runbook](DEPLOYMENT_RUNBOOK.md)** - Deployment guide
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[Code Review Report](docs/CODE_REVIEW_REPORT.md)** - Full code audit

---

## ✨ What's New in v3.0.0

### Major Features

- **NotificationCenter** - Real-time notifications with filtering
- **NotificationPreferences** - Multi-channel notification settings
- **TeamChat** - Real-time team messaging
- **ActivityFeed** - Live activity stream
- **AdvancedAnalytics** - Business intelligence dashboard
- **ProjectCalendar** - Project scheduling with Month/Week/Day views

### Platform Achievements

- ✅ **100/100 Platform Health Score**
- ✅ **121 Tests Passing** (500% increase)
- ✅ **WCAG 2.1 AA Compliant** (95/100 accessibility)
- ✅ **10 Zod Validation Schemas** (runtime type safety)
- ✅ **14 Keyboard Shortcuts** (power user support)
- ✅ **Lighthouse CI** (performance budgets enforced)

---

## Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + PostgreSQL + JWT auth
- **Real-time**: WebSocket for notifications and chat
- **Testing**: Vitest (unit) + Playwright (E2E)
- **CI/CD**: GitHub Actions + Lighthouse CI
- **Deployment**: Docker + VPS (Hostinger)

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

### 3. Reset and bootstrap the local database

```bash
cd server
npm run db:reset:local
```

This rebuilds the local Docker Postgres schema from the repo SQL in a deterministic order,
including tenant tables, AI conversation storage, notifications, and seed data.

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
