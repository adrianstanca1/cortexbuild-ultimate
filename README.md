# CortexBuild Ultimate

**Construction Management Platform** — Dark theme industrial intelligence aesthetic with Express.js backend.

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + PostgreSQL + JWT auth
- **Design System**: Custom CSS variables (--slate-*, --amber-*, --emerald-*, --red-*)

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

### 3. Start the backend

```bash
cd server
npm start
```

Server runs on `http://localhost:3001`

### 4. Start the frontend

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## Modules

18 construction management modules:
- **Dashboard** — Site Command Center with health radar, weather, alerts
- **Safety** — HSE Intelligence Hub with risk analytics, RIDDOR reporting
- **Projects** — Project tracking with progress, budget, workforce
- **Invoicing** — Invoice management with revenue tracking
- **Accounting** — Financial management
- **Procurement** — Purchase orders, materials
- **RAMS** — Risk Assessment & Method Statements (UK compliance)
- **CIS** — Construction Industry Scheme returns (UK)
- **Teams** — Workforce management
- **Timesheets** — Hours tracking
- **Subcontractors** — Subcontractor management
- **Plant** — Equipment management
- **Materials** — Materials tracking
- **RFIs** — Requests for Information
- **Change Orders** — Variation management
- **Punch List** — Snagging / defect tracking
- **Inspections** — QA inspections
- **Risk Register** — Risk management
- **Documents** — Document control
- **Drawings** — Plan management
- **Field View** — Map integration
- **CRM** — Client management
- **Tenders** — Bids & proposals
- **Meetings** — Meeting management
- **Daily Reports** — Site diaries
- **Analytics** — Business intelligence
- **AI Assistant** — AI-powered assistance

## Design Features

- **Dark theme** with slate/amber/emerald color palette
- **Industrial command center** aesthetic
- **Inline style pattern** for dynamic theming
- **CSS utility classes** for hover states
- **Recharts** for data visualization

## API Endpoints

Base URL: `http://localhost:3001`

- `GET /api/health` — Health check
- `POST /api/auth/login` — Authenticate
- `POST /api/auth/register` — Register
- `GET /api/:table` — List records (JWT required)
- `POST /api/:table` — Create record (JWT required)
- `PUT /api/:table/:id` — Update record (JWT required)
- `DELETE /api/:table/:id` — Delete record (JWT required)
- `POST /api/upload` — File upload (JWT required)

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

### Backend (VPS / Docker)

```bash
cd server
npm start
# Or use Docker with postgres
```

## License

© 2026 CortexBuild Ltd. UK Construction Management Platform.
