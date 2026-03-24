# 🏗️ CortexBuild Ultimate - System Architecture

## Executive Summary

CortexBuild Ultimate is a **unified construction intelligence platform** that merges:
- 20+ construction industry modules
- Multi-provider AI/ML engine
- Enterprise SaaS architecture
- Real-time collaboration
- Workflow automation
- Field + office operations

---

## 📊 Unified Data Model

### Core Entities (85+ models)

```
Organization (multi-tenant root)
├── Company (tenant subdivision)
├── User (RBAC with 5 roles)
├── Project (construction lifecycle)
│   ├── Task (work tracking)
│   ├── Milestone (critical path)
│   ├── WorkPackage (WBS hierarchy)
│   ├── CostItem (financial tracking)
│   ├── BudgetLine (budget management)
│   ├── ChangeOrder (change management)
│   ├── RFI (information requests)
│   ├── Submittal (review workflow)
│   ├── Document (document control)
│   ├── Drawing (revision tracking)
│   ├── DailyLog (field operations)
│   ├── SafetyIncident (HSE compliance)
│   ├── QualityCheck (QA/QC)
│   ├── PunchList (closeout)
│   ├── Defect (snagging)
│   ├── Equipment (fleet management)
│   ├── Material (supply chain)
│   ├── Subcontractor (vendor management)
│   ├── Permit (regulatory)
│   ├── TimeEntry (labor tracking)
│   ├── WeatherLog (delay evidence)
│   ├── SiteDiary (comprehensive log)
│   ├── ToolboxTalk (safety briefings)
│   ├── RiskAssessment (RAMS)
│   ├── PermitToWork (high-risk control)
│   └── ProgressClaim (payment apps)
```

### Database Statistics
- **4,500+ lines** of Prisma schema
- **85+ models** with full relations
- **55+ enums** for type safety
- **100+ indexes** for performance
- **Complete audit trail** on all entities

---

## 🎯 Module Architecture

### 1. Field Operations Module
```
apps/field/
├── DailySiteInspector/      # Photo documentation, geotagging
├── CrewTimeTracker/         # Clock in/out, geolocation
├── QualityControlChecklist/ # Template-based inspections
├── SafetyIncidentReporter/  # Severity workflow, investigation
├── SmartProcurement/        # Vendor comparison, barcode
└── SiteInspector/           # Comprehensive site audits
```

**Key Features:**
- Offline mode with sync
- PDF report generation
- Geolocation tagging
- Photo documentation
- Real-time collaboration

### 2. Office Management Module
```
apps/office/
├── ProjectsDashboard/       # Portfolio overview
├── RFIModules/              # RFI lifecycle
├── FinancialControl/        # Budget vs actual
├── DocumentControl/         # EDMS with versioning
├── TeamChat/                # Real-time messaging
└── ExecutiveReporting/      # C-suite dashboards
```

**Key Features:**
- Multi-project portfolio
- Financial forecasting
- Document revision tracking
- Team collaboration
- Client reporting

### 3. AI Engine Module
```
apps/ai-engine/
├── providers/
│   ├── openai.ts           # GPT-4 integration
│   ├── gemini.ts           # Google Gemini
│   ├── claude.ts           # Anthropic Claude
│   └── ollama.ts           # Local models
├── capabilities/
│   ├── timeline-prediction.ts
│   ├── cost-prediction.ts
│   ├── risk-assessment.ts
│   ├── resource-optimization.ts
│   ├── document-analysis.ts
│   ├── image-analysis.ts
│   └── voice-commands.ts
└── agents/
    ├── cognitive-core.ts
    ├── oracle.ts
    ├── workflow-ai.ts
    └── neural-network.ts
```

**Key Features:**
- Multi-provider abstraction
- Predictive analytics
- Computer vision
- NLP/OCR processing
- Workflow automation

### 4. Enterprise Platform Module
```
apps/enterprise/
├── multi-tenant/           # Organization isolation
├── rbac/                   # 5-role permissions
├── billing/                # Stripe integration
├── api-gateway/            # Rate limiting
├── webhook-system/         # Event notifications
└── workflow-engine/        # Visual automation
```

**Key Features:**
- Row-level security
- Entitlement management
- Usage tracking
- API rate limiting
- Event-driven architecture

---

## 🔐 Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────┐
│           Application Layer             │
│  ┌─────────────────────────────────┐   │
│  │  Route Guards (RouteGuard.tsx)  │   │
│  │  Permission Hooks               │   │
│  │  Feature Flags                  │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│           Authentication Layer          │
│  ┌─────────────────────────────────┐   │
│  │  NextAuth.js                    │   │
│  │  JWT Tokens                     │   │
│  │  MFA (TOTP)                     │   │
│  │  Session Management             │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│           Database Layer                │
│  ┌─────────────────────────────────┐   │
│  │  Row-Level Security (RLS)       │   │
│  │  Organization isolation         │   │
│  │  Encrypted fields               │   │
│  │  Audit logging                  │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│           Infrastructure Layer          │
│  ┌─────────────────────────────────┐   │
│  │  WAF (Cloudflare)               │   │
│  │  DDoS protection                │   │
│  │  Rate limiting                  │   │
│  │  Bot detection                  │   │
│  └─────────────────────────────────┘   │
```

### RBAC Matrix

| Role | Projects | Financial | Safety | Team | Settings |
|------|----------|-----------|--------|------|----------|
| Super Admin | All | All | All | All | Platform |
| Company Owner | All | All | All | All | Company |
| Admin | All | View | All | Manage | Company |
| Project Manager | Assigned | View | View | View | Project |
| Field Worker | View | None | Create | None | None |

---

## 🔄 Real-time Architecture

### WebSocket Infrastructure

```
┌──────────────────────────────────────────────────┐
│              WebSocket Cluster                   │
│                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │  Presence   │  │   Message   │  │   Event  │ │
│  │  Service    │  │   Queue     │  │  Bus     │ │
│  │             │  │  (Redis)    │  │          │ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
│                                                  │
│  Features:                                       │
│  • User presence tracking                        │
│  • Live cursor sharing                           │
│  • Collaborative editing                         │
│  • Real-time notifications                       │
│  • Conflict resolution                           │
│  • Message compression                           │
└──────────────────────────────────────────────────┘
```

### Event Types

1. **Project Events**: created, updated, deleted, status_changed
2. **Task Events**: assigned, completed, blocked, unblocked
3. **Document Events**: uploaded, revised, approved, rejected
4. **Financial Events**: budget_updated, cost_committed, invoice_paid
5. **Safety Events**: incident_reported, investigation_started, closed
6. **Quality Events**: inspection_created, defect_found, verified
7. **Field Events**: daily_log_created, weather_updated, time_logged

---

## 🤖 AI/ML Architecture

### Multi-Provider Strategy

```
┌─────────────────────────────────────────────────┐
│              AI Abstraction Layer               │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │         Unified AI Interface            │   │
│  │  generateCompletion(options)            │   │
│  │  analyzeImage(imageUrl, prompt)         │   │
│  │  generateCode(prompt, language)         │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ OpenAI  │  │ Gemini  │  │ Claude  │        │
│  │ GPT-4   │  │ gemini  │  │ claude-3│        │
│  │         │  │ pro     │  │         │        │
│  └─────────┘  └─────────┘  └─────────┘        │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │         Local Fallback (Ollama)         │   │
│  │         llama.cpp inference             │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### AI Capabilities

| Capability | Model | Use Case |
|------------|-------|----------|
| Timeline Prediction | GPT-4 + historical data | Project completion forecasting |
| Cost Prediction | GPT-4 + financial data | Budget overrun detection |
| Risk Assessment | Claude-3 + RAMS data | Automated risk identification |
| Resource Optimization | Gemini + scheduling | ML-based allocation |
| Document Analysis | GPT-4 Vision + OCR | Data extraction from PDFs |
| Image Analysis | GPT-4 Vision | Defect detection in photos |
| Voice Commands | Whisper + GPT-4 | Hands-free operation |
| Code Generation | GPT-4 | Custom function creation |

---

## 📦 Deployment Architecture

### Infrastructure Stack

```
┌──────────────────────────────────────────────────┐
│              Frontend (Vercel)                   │
│  Next.js 15 + React 19 + TypeScript             │
│  Edge Functions + ISR                           │
│  Global CDN (Cloudflare)                        │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│              Backend (Render)                    │
│  Express.js + Node.js 22                        │
│  Auto-scaling + Load balancing                  │
│  Health checks + Auto-restart                   │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│              Database (Supabase)                 │
│  PostgreSQL 15 + Row-Level Security             │
│  Real-time subscriptions                        │
│  Automatic backups                              │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│              Cache Layer (Redis)                 │
│  Session management                             │
│  Query result caching                           │
│  Pub/Sub for WebSocket                          │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│              Storage (AWS S3)                    │
│  Document storage                               │
│  Photo attachments                              │
│  Glacier for archives                           │
└──────────────────────────────────────────────────┘
```

### Scalability Strategy

1. **Horizontal Scaling**: Redis session management, WebSocket clustering
2. **Database Optimization**: Connection pooling, read replicas, query caching
3. **CDN**: Cloudflare for static assets, image optimization
4. **Auto-scaling**: Render auto-scaling based on CPU/memory
5. **Load Balancing**: Vercel edge network, Render load balancers

---

## 🔌 Integration Architecture

### Third-party Integrations

```
┌─────────────────────────────────────────────────┐
│           Integration Framework                 │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │         Pluggable Architecture          │   │
│  │  • Plugin system                        │   │
│  │  • Webhook system                       │   │
│  │  • API gateway                          │   │
│  │  • Authentication bridge                │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  Pre-built Integrations:                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Procore  │  │QuickBooks│  │  Slack   │     │
│  │          │  │          │  │          │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Teams   │  │  BIM 360 │  │PlanGrid  │     │
│  │          │  │          │  │          │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │Fieldwire │  │  Xero    │  │  Zapier  │     │
│  │          │  │          │  │          │     │
│  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────┘
```

### Integration Patterns

1. **OAuth 2.0**: Procore, QuickBooks, Xero
2. **API Key**: Slack, Teams, Zapier
3. **Webhook**: All integrations support webhooks
4. **Bidirectional Sync**: Procore, BIM 360
5. **Data Mapping**: Automatic field mapping engine

---

## 📈 Observability

### Monitoring Stack

```
┌─────────────────────────────────────────────────┐
│              Observability Stack                │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │         OpenTelemetry                   │   │
│  │  Distributed tracing                    │   │
│  │  Metrics collection                     │   │
│  │  Structured logging                     │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Grafana  │  │Prometheus│  │  Sentry  │     │
│  │Dashboards│  │Alerting  │  │Error Trk │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                  │
│  Key Metrics:                                   │
│  • API response time                            │
│  • Database query time                          │
│  • WebSocket connections                        │
│  • AI request latency                           │
│  • Error rates                                  │
│  • User active sessions                         │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Development Workflow

### Git Strategy

```
main (production)
  │
  ├── staging (pre-production)
  │     │
  │     ├── feature/ai-prediction
  │     ├── feature/workflow-engine
  │     └── feature/vendor-portal
  │
  └── develop (integration)
        │
        ├── fix/rfi-numbering
        ├── fix/daily-log-sync
        └── enhancement/gantt-view
```

### CI/CD Pipeline

1. **Pre-commit**: ESLint, Prettier, Type check
2. **PR**: Vitest unit tests, Playwright E2E
3. **Merge**: Build, deploy to staging
4. **Staging**: Smoke tests, performance tests
5. **Production**: Canary deployment, gradual rollout

---

## 📊 Key Metrics

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time | < 200ms | TBD |
| Page Load Time | < 2s | TBD |
| WebSocket Latency | < 50ms | TBD |
| Database Query Time | < 50ms | TBD |
| AI Response Time | < 3s | TBD |
| Error Rate | < 0.1% | TBD |
| Uptime | 99.9% | TBD |

---

## 🎯 Roadmap

### Phase 1: Foundation (Complete)
- ✅ Database schema (4,500 lines)
- ✅ Core architecture
- ✅ Multi-tenant setup
- ✅ RBAC system

### Phase 2: Construction Modules (In Progress)
- 🔄 Project Management
- 🔄 Financial Management
- 🔄 Document Control
- 🔄 RFI/Submittal

### Phase 3: AI Engine
- ⏳ Multi-provider AI
- ⏳ Timeline prediction
- ⏳ Cost prediction
- ⏳ Risk assessment

### Phase 4: Field Apps
- ⏳ Daily Site Inspector
- ⏳ Crew Time Tracker
- ⏳ Quality Control
- ⏳ Safety Reporter

### Phase 5: Enterprise
- ⏳ Billing system
- ⏳ API gateway
- ⏳ Workflow engine
- ⏳ Webhook system

---

**Built with ❤️ by Adrian Stanca**
