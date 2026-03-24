# AGENTS.md - Development Guidelines for CortexBuild Ultimate

## 🎯 Project Overview
Enterprise construction intelligence SaaS platform with 40+ Prisma models, multi-tenant architecture, RBAC, local LLM (Ollama), and 10 AI agents.

**Domain:** Construction project management (commercial, residential, industrial)
**Deployment:** VPS (72.62.132.43, 36GB RAM, 8 cores, 400GB SSD) with Docker stack
**AI Provider:** Ollama with Llama 3.1 8B (local, quantized)

---

## 🛠️ Build & Development Commands

### Core Workflow
```bash
# Install dependencies
npm install

# Development server (web + API + worker)
npm run dev

# Production build
npm run build          # Next.js + TypeScript compilation
npm run build:api      # Server-side TypeScript only

# Start production server
npm start
```

### Database Operations
```bash
npx prisma generate    # Generate Prisma client (always run after schema changes)
npx prisma migrate dev # Create + apply migration (development)
npx prisma migrate deploy  # Apply pending migrations (production)
npx prisma db seed     # Seed demo data (uses scripts/seed.ts)
npx prisma db push     # Direct schema sync (skip migrations)
npx prisma studio      # Open Prisma Studio GUI
```

### Testing
```bash
npm test              # Run Vitest suite
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright E2E tests
```

**Running Single Tests:**
```bash
# Specific test file
npx vitest run path/to/file.test.ts

# Test name pattern
npx vitest run -t "test name pattern"

# Watch single file
npx vitest path/to/file.test.ts --watch
```

### Code Quality
```bash
npm run lint          # ESLint check
npm run lint:fix      # Auto-fix ESLint
npm run format        # Prettier check
npm run format:fix    # Auto-format
```

### Utility Scripts
```bash
npm run prisma        # Direct Prisma CLI access
npm run db:backup     # Backup database
npm run db:restore    # Restore from backup
npm run ai:agents     # Run AI agent orchestration
npm run workflow:run  # Execute workflow engine
npm run cleanup       # Cleanup utilities
```

---

## 📐 Code Style Guidelines

### TypeScript Configuration
- **Target**: ES2022, **Module**: ESNext, **ModuleResolution**: bundler
- **Strict mode**: enabled
- **Paths**: `@/*` maps to root, `@/components/*`, `@/lib/*`, `@/api/*`
- **No emit** for Next.js compilation, separate `tsconfig.server.json` for API

### Import Order
```typescript
// 1. React
import { useState, useEffect } from 'react'

// 2. Next.js
import { NextRequest, NextResponse } from 'next/server'

// 3. Third-party libraries
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

// 4. Internal modules (aliased)
import { prisma } from '@/lib/database/client'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'

// 5. Components
import { ProjectsList } from '@/components/construction/ProjectsList'
import { Button } from '@/components/ui/button'
```

### Naming Conventions
- **Files**: PascalCase for components (`ProjectsList.tsx`), camelCase for utilities (`utils.ts`)
- **API routes**: lowercase with brackets for dynamic segments (`[id]/route.ts`)
- **Components**: PascalCase, export as `export function ComponentName()`
- **Types/Interfaces**: PascalCase, suffix with `Props`, `Config`, `Response`
- **Database models**: PascalCase (Prisma schema convention)
- **Constants**: UPPER_SNAKE_CASE

### Component Pattern
```typescript
'use client' // When using React hooks

interface ComponentProps {
  title: string
  projectId?: string  // Optional with ?
  onSubmit: (data: FormData) => void
}

export function ComponentName({ title, projectId, onSubmit }: ComponentProps) {
  // Component logic
  return <div>{title}</div>
}
```

### Error Handling
```typescript
// API routes - always return NextResponse.json
try {
  // ... logic
  return NextResponse.json({ data })
} catch (error) {
  console.error('Error description:', error)
  return NextResponse.json(
    { error: 'User-friendly message' },
    { status: 500 }
  )
}

// Zod validation
const schema = z.object({
  title: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
})
const parsed = schema.safeParse(body)
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error }, { status: 400 })
}
```

### Async/Await Pattern
- Always use async/await over .then()
- Await Next.js 15 params: `const { id } = await params`
- Use `Promise.all()` for parallel independent operations
- Server components: await data fetching directly in component body

### Database Queries (Prisma)
```typescript
// Always use transaction for related writes
await prisma.$transaction(async (tx) => {
  await tx.model.create({...})
  await tx.model.update({...})
})

// Use select/include for performance
await prisma.task.findMany({
  where: { projectId },
  include: { project: { select: { name: true, code: true } } },
  orderBy: { createdAt: 'desc' },
})

// Multi-tenancy: ALWAYS filter by organizationId
await prisma.project.findMany({
  where: { organizationId: session.user.organizationId },
})

// Optimistic concurrency with updatedAt
await prisma.task.update({
  where: { id: taskId, updatedAt: optimisticDate },
  data: { status: 'COMPLETED' },
})
```

### Authentication Pattern
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'

const session = await getServerSession(authOptions)
if (!session || !session.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Access: session.user.id, session.user.role, session.user.organizationId
// Roles: SUPER_ADMIN, ORG_ADMIN, COMPANY_ADMIN, PROJECT_MANAGER, FIELD_WORKER, VIEWER
```

### RBAC Permission Checks
```typescript
// Role-based guard
if (!['SUPER_ADMIN', 'ORG_ADMIN'].includes(session.user.role)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Resource ownership check
const project = await prisma.project.findFirst({
  where: { id: projectId, organizationId: session.user.organizationId },
})
if (!project) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
```

### AI/LLM Integration (Ollama)
```typescript
// lib/ai/unified-ai-service.ts pattern
import { Ollama } from 'ollama'

const ollama = new Ollama({ host: 'http://localhost:11434' })

async function generateConstructionInsight(prompt: string) {
  const response = await ollama.chat({
    model: 'llama3.1:8b',
    messages: [{ role: 'user', content: prompt }],
    options: { temperature: 0.7, max_tokens: 4096 },
  })
  return response.message.content
}

// Always stream for long responses
async function streamAnalysis(messages: Message[]) {
  const stream = await ollama.chat({
    model: 'llama3.1:8b',
    messages,
    stream: true,
  })
  for await (const chunk of stream) {
    yield chunk.message.content
  }
}
```

---

## 🏗️ Architecture Patterns

### API Route Structure
```
app/api/
├── auth/[...nextauth]/route.ts    # NextAuth entry point
├── auth/[...nextauth]/options.ts  # Auth configuration
├── projects/route.ts              # GET /api/projects, POST /api/projects
├── tasks/
│   ├── route.ts                   # GET, POST /api/tasks
│   └── [id]/route.ts              # GET, PATCH, DELETE /api/tasks/:id
├── rfis/
│   ├── route.ts                   # GET, POST /api/rfis
│   └── [id]/route.ts              # GET, PATCH, DELETE /api/rfis/:id
└── health/route.ts                # GET /api/health (system status)
```

**Route HTTP Methods:**
- Collection routes (`/api/resource`): GET (list), POST (create)
- Item routes (`/api/resource/[id]`): GET (single), PATCH (update), DELETE

### Request/Response Schema
```typescript
// Request validation with Zod
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  projectId: z.string().cuid(),
  assigneeId: z.string().cuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
})

// Success response
NextResponse.json({ task: TaskType }, { status: 201 })

// Error response
NextResponse.json({ error: 'Message', details?: object }, { status: 400 })
```

### Multi-Tenancy Enforcement
```typescript
// EVERY query must include organizationId filter
const where: any = { organizationId: session.user.organizationId }

// For nested resources, traverse through parent
const task = await prisma.task.findFirst({
  where: {
    id: taskId,
    project: { organizationId: session.user.organizationId },
  },
})

// Bulk operations require explicit filtering
await prisma.task.updateMany({
  where: {
    id: { in: taskIds },
    project: { organizationId: session.user.organizationId },
  },
  data: { status: 'COMPLETED' },
})
```

### RBAC Roles (prisma/schema.prisma:14-21)
| Role | Scope | Permissions |
|------|-------|-------------|
| `SUPER_ADMIN` | Platform | All organizations, user management |
| `ORG_ADMIN` | Organization | All companies, billing, settings |
| `COMPANY_ADMIN` | Company | All projects, team management |
| `PROJECT_MANAGER` | Project | Full project CRUD, tasks, RFIs |
| `FIELD_WORKER` | Assigned tasks | Task updates, logs, incidents |
| `VIEWER` | Read-only | View assigned projects only |

```typescript
// Permission matrix helper
const canAccessProject = (user: User, project: Project) => {
  if (user.role === 'SUPER_ADMIN') return true
  if (user.role === 'ORG_ADMIN') return true
  if (user.companyId === project.companyId) return true
  return false // No access
}
```

### Multi-Tenancy
All queries MUST filter by `organizationId` or `companyId`:
```typescript
where: {
  organizationId: session.user.organizationId,
  // ... other filters
}
```

### RBAC Roles (prisma/schema.prisma)
1. **SUPER_ADMIN** - Platform-wide access
2. **ORG_ADMIN** - Organization management
3. **COMPANY_ADMIN** - Company-level admin
4. **PROJECT_MANAGER** - Full project access
5. **FIELD_USER** - Field operations only
6. **VIEWER** - Read-only access

Check permissions in API routes:
```typescript
if (session.user.role !== 'PROJECT_MANAGER' || session.user.role === 'ORG_ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## 📁 Key Directories

```
cortexbuild-ultimate/
├── app/                        # Next.js App Router
│   ├── (auth)/                # Auth layout group
│   │   ├── auth/signin/       # Sign-in page
│   │   └── auth/signout/      # Sign-out page
│   ├── (dashboard)/           # Dashboard layout group
│   │   ├── projects/          # Projects module
│   │   ├── tasks/             # Tasks module
│   │   ├── rfis/              # RFI module
│   │   └── safety/            # Safety module
│   ├── api/                   # API routes
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Dashboard home
├── components/
│   ├── construction/          # Domain components (ProjectsList, RFIBoard)
│   ├── ui/                    # Radix-based primitives (Button, Dialog)
│   └── shared/                # Shared layouts (Header, Sidebar)
├── lib/
│   ├── database/              # Prisma client singleton
│   ├── ai/                    # Unified AI service (Ollama/OpenAI)
│   ├── services/              # Business logic (workflow-engine.ts)
│   └── validators/            # Zod schemas
├── prisma/
│   ├── schema.prisma          # 40 validated models
│   └── migrations/            # SQL migrations
├── scripts/                   # Seed, backup, deployment
├── .agents/                   # AI agent system
│   ├── orchestrator.js        # Agent coordinator
│   ├── agents/                # 6 main agents
│   └── subagents/             # 4 subagents
├── server/                    # Express API server
├── worker/                    # Background job processor
└── docker-compose.yml         # VPS stack (PostgreSQL/Redis/Ollama/MinIO)
```

---

## 🚫 Common Pitfalls

1. **Next.js 15 params**: Dynamic routes require `params: Promise<{ id: string }>`
2. **Prisma relations**: Always define both sides of relations in schema
3. **Auth import**: Use `@/app/api/auth/[...nextauth]/options` not relative paths
4. **Server components**: Add `'use client'` when using hooks
5. **Environment variables**: Load via `dotenv` in server scripts
6. **Transaction deadlocks**: Keep transactions short, avoid nested transactions
7. **Multi-tenancy**: NEVER query without `organizationId` filter
8. **Ollama connection**: Use `http://ollama:11434` in Docker, `http://localhost:11434` locally
9. **BigInt in Prisma**: Use `BigInt` for file sizes, serialize with `toString()` in JSON
10. **Date handling**: Store as `DateTime`, serialize as ISO strings for API responses

---

## 🔍 Debugging

```bash
# Check Prisma client generation
npx prisma generate && echo "Prisma OK"

# Test database connection
curl http://localhost:3001/api/health/database

# View Docker logs
docker-compose logs -f app

# Type check without build
npx tsc --noEmit

# Check Ollama status
curl http://localhost:11434/api/tags

# List running containers
docker-compose ps

# Exec into app container
docker-compose exec app bash

# Tail production logs
docker-compose logs -f --tail=100 app

# Check disk usage
docker system df
```

---

## 🐳 VPS Deployment

### Docker Stack (docker-compose.yml)
```yaml
services:
  postgres:16    # Primary database (port 5432)
  redis:7        # Cache & queues (port 6379)
  ollama         # Local LLM (port 11434)
  minio          # S3-compatible storage (port 9000/9001)
  app            # Next.js application (port 3000)
  nginx          # Reverse proxy + SSL (port 80/443)
  prometheus     # Metrics (port 9090)
  grafana        # Dashboards (port 3001)
```

### Deploy Workflow
```bash
# 1. Build image
docker build -t cortexbuild:latest .

# 2. Start stack
docker-compose up -d

# 3. Run migrations
docker-compose exec app npx prisma migrate deploy

# 4. Seed data
docker-compose exec app npx prisma db seed

# 5. Pull Ollama model
docker-compose exec ollama ollama pull llama3.1:8b

# 6. Verify health
curl http://72.62.132.43:3000/api/health
```

### Environment Variables (Critical)
```bash
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/cortexbuild

# Redis
REDIS_URL=redis://redis:6379

# Ollama
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=llama3.1:8b

# MinIO
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Auth
NEXTAUTH_SECRET=generate_with_openssl
NEXTAUTH_URL=http://72.62.132.43

# Stripe (billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🤖 AI Agents System

### Main Agents (/.agents/agents/)
| Agent | Purpose | Trigger |
|-------|---------|---------|
| `project-analyzer` | Risk analysis, health scoring | Project status change |
| `safety-compliance` | Incident monitoring, permits | Safety incident created |
| `financial-agent` | Budget tracking, cost alerts | Cost item/change order |
| `document-processor` | RFI/submittal analysis | Document upload |
| `schedule-agent` | Critical path, delays | Task status change |
| `quality-agent` | Defect tracking, inspections | Quality check created |

### Subagents (/.agents/subagents/)
- `rfi-analyzer` - RFI priority classification
- `change-order-processor` - CO impact analysis
- `permit-tracker` - Permit expiration alerts
- `weather-impact-analyzer` - Weather delay predictions

### Agent Invocation Pattern
```typescript
// lib/ai/agent-orchestrator.ts
async function invokeAgent(agentName: string, context: AgentContext) {
  const prompt = await readAgentPrompt(agentName)
  const messages = buildPrompt(prompt, context)
  
  const response = await ollama.chat({
    model: 'llama3.1:8b',
    messages,
    options: { temperature: 0.3 }, // Lower for analysis tasks
  })
  
  return parseAgentOutput(response.message.content)
}
```

---

## 📊 Construction Domain Models

### Core Entities (schema.prisma)
**Organization** → **Company** → **Project** → **Task**

### Construction Modules
| Module | Models | Purpose |
|--------|--------|---------|
| Projects | Project, Milestone, ProjectMember | Project lifecycle |
| Tasks | Task | Work breakdown structure |
| Financial | CostItem, ChangeOrder, ProgressClaim | Budget & billing |
| RFI | RFI, RFIAttachment | Request for information |
| Submittal | Submittal, SubmittalAttachment | Material approvals |
| Safety | SafetyIncident, IncidentPhoto | OSHA compliance |
| Quality | QualityCheck, Defect, DefectPhoto | QA/QC tracking |
| Documents | Document, Drawing, DocumentVersion | Document control |
| Logs | DailyLog, SiteDiary, WeatherLog | Field documentation |
| Workflow | Workflow, WorkflowExecution | Process automation |

### Status Enums
- **ProjectStatus**: PLANNING → ACTIVE → ON_HOLD → COMPLETED → CANCELLED
- **TaskStatus**: NOT_STARTED → IN_PROGRESS → BLOCKED → REVIEW → COMPLETED
- **RFI Status**: open → in_review → answered → closed
- **ChangeOrder**: draft → submitted → approved → rejected → executed

---

## 📚 Reference Files
- `prisma/schema.prisma` - 40 validated models with relations
- `package.json` - All npm scripts + dependencies
- `tsconfig.json` - TypeScript paths + strict mode
- `.env.example` - 60+ environment variables
- `docker-compose.yml` - Production stack definition
- `scripts/seed.ts` - Demo data seed script
- `app/api/auth/[...nextauth]/options.ts` - Auth configuration
- `lib/database/client.ts` - Prisma singleton
- `lib/ai/unified-ai-service.ts` - Multi-provider AI
- `lib/services/workflow-engine.ts` - Workflow automation
- `.agents/orchestrator.js` - Agent orchestration
- `README.md` - Quick start guide
- `ARCHITECTURE.md` - System architecture
- `ULTIMATE_PLATFORM_SPEC.md` - Full platform specification
