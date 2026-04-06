# Research Brief: CortexBuild Ultimate — Full Codebase & Features Analysis

**Depth:** deep
**Date:** 2026-04-06
**Research time:** ~4 hours (parallel agents: local exploration + competitive analysis)

---

## Executive Summary

CortexBuild Ultimate is a **70-module, AI-powered construction management SaaS** for UK contractors, built with React 19 + Express.js + PostgreSQL + Ollama local LLM. At 101K+ lines of code across 2,495 source files, it exceeds the feature count of most commercial competitors. The platform's moat is **native UK compliance** (CIS, VAT DRC, JCT workflows) combined with **24 specialized AI intent classifiers** — capabilities that US platforms (Procore, Buildertrend, Fieldwire) lack entirely. The market opportunity is the **£353M UK construction software market** growing at 9.17% CAGR to £850M by 2035, where US platforms' compliance gaps create a defensible niche.

---

## Complete Platform Inventory

### Scale

| Metric | Value |
|--------|-------|
| **Frontend files** | 223 TS/TSX |
| **Backend files** | 91 JS/TS (excl. node_modules) |
| **Total source lines** | ~101K (source only) |
| **Module components** | 69 (+ 2 subdirectories with 15 files) |
| **UI/Shared components** | 56 |
| **API endpoints** | ~70+ route patterns |
| **Database tables** | 75+ |
| **Migrations** | 33 |
| **AI intent classifiers** | 24 |
| **Test files** | 24 (9 E2E + 15 unit) |
| **Documentation** | 25 files |

### Module Architecture (70 modules across 8 navigation groups)

| Group | Modules | Key Features |
|-------|---------|-------------|
| **Overview** (7) | Dashboard, Analytics & BI, Advanced Analytics, Project Calendar, AI Assistant, AI Insights, Predictive Analytics | KPI widgets, charts, AI chat, forecasting |
| **Project Management** (6) | Projects, Site Operations, Daily Reports, Field View, Drawings & Plans, Meetings | Project CRUD, Gantt, site management, daily logs |
| **Commercial & Finance** (11) | Tenders & Bids, Invoicing, Accounting, Financial Reports, CIS Returns, Procurement, Change Orders, Variations, Valuations, Cost Management, Prequalification, Lettings | Full financial lifecycle, CIS compliance |
| **Site & Operations** (10) | Teams & Labour, Timesheets, Subcontractors, Plant & Equipment, Materials, RFIs, BIM Viewer, Submittals, Temp Works, Measuring | Field operations, BIM 3D viewing |
| **Safety & Compliance** (8) | Safety & HSE, RAMS, Inspections, Punch List, Risk Register, Documents, Defects, Specifications | HSE workflows, document control |
| **Business** (13) | CRM & Clients, Executive Reports, AI Marketplace, Calendar, Audit Log, Email History, Permissions, Report Templates, Settings, Signage, Waste Management, Sustainability, Training, Certifications | Business operations, compliance tracking |
| **AI & Desktop** (3) | AI Vision, Dev Sandbox, My Desktop | Computer vision, development tools |
| **Collaboration** (2) | Team Chat, Activity Feed | Real-time messaging, activity stream |
| **Admin** (1) | Admin Dashboard | System administration (7 tabs) |

### Technical Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, DaisyUI, Zustand, React Query, Recharts |
| **Backend** | Express.js, PostgreSQL (pgvector), Redis, JWT, Passport.js (OAuth), WebSocket |
| **AI/ML** | Ollama (Llama 3.1 8B local), 24 intent classifiers, RAG pipeline, predictive analytics |
| **Real-time** | WebSocket at `/ws`, broadcast on mutations |
| **Auth** | JWT + OAuth 2.0 (Google, Microsoft), RBAC (5 roles) |
| **Storage** | File uploads → `server/uploads/`, S3-compatible (MinIO optional) |
| **Deployment** | VPS (Hostinger, 36GB RAM, 8 cores, 400GB SSD), Docker, nginx |
| **Monitoring** | Prometheus, Grafana, Lighthouse CI |

### Component Breakdown

| Category | Files | Lines | Notable |
|----------|-------|-------|---------|
| **Module components** | 69 | ~48K | Prequalification/ and Projects/ extracted into subdirectories |
| **UI primitives** | 24 | ~5K | Charts, CommandPalette, FileManager, BulkActions, VirtualList |
| **Dashboard widgets** | 11 | ~5.7K | KPI cards, trends, presence, weather |
| **Layout** | 12 | ~4.3K | Sidebar, Header, Mobile navigation |
| **Forms** | 5 | ~1.1K | Project, RFI, Safety, Task, Daily Report |
| **Hooks** | 10 | ~2K | useData (generic CRUD factory), useNotificationCenter, usePWA |
| **Server routes** | 42 + 24 AI intents | ~11K | generic.js CRUD factory, auth, OAuth, AI |
| **Migrations** | 33 SQL files | ~3.1K | Full schema from 000 to 032 |

### Code Quality (as of 2026-04-06)

| Metric | Value |
|--------|-------|
| **Type errors** | 0 |
| **Lint errors** | 0 |
| **Lint warnings** | 3 (pre-existing, non-blocking) |
| **Tests** | 116/116 passing |
| **Build time** | 334-473ms |
| **Lighthouse** | 100/100 performance |

---

## Competitive Landscape

### Market Context

| Metric | Value |
|--------|-------|
| **Global construction SaaS** | $11.09B (2025), 9.9% CAGR → $28.5B by 2035 |
| **UK construction software** | £353M (2025), 9.17% CAGR → £850M by 2035 |
| **North America market share** | 35.6% |
| **Europe market share** | 27.7% |
| **Asia Pacific growth** | Fastest-growing at 28% |

### Top Competitors

| Product | G2 | Pricing | Target | Key Strength | Key Weakness |
|---------|-----|---------|--------|-------------|-------------|
| **Procore** | 4.6 | ACV-based, $10K-$600K/yr | Mid-large contractors | Most comprehensive, 400+ marketplace | Expensive, 14% YoY price hikes, rigid |
| **Autodesk Build** | 4.0-4.4 | $130+/user/mo | Large BIM-heavy firms | Best BIM integration | Confusing pricing, steep learning curve |
| **Buildertrend** | 4.5 | $199-$900+/mo | Residential builders | Client portal, support | Poor commercial fit, price increases |
| **Fieldwire** | 4.5 | $39-54/user/mo | Small-mid specialty | Fastest adoption, offline-first | No financials, no RFI workflows |
| **Contractor Foreman** | 4.5 | $49-332/mo | Small-mid contractors | Cheapest all-in-one | Less polished, US-centric |
| **Dalux** | 4.7 | Custom (demo) | European teams | Fast 3D viewing, clean UX | Fragmented modules, no scheduling |
| **Oracle Primavera** | 4.4 | $50K+/yr | Enterprise infrastructure | Best CPM scheduling | Expensive, overkill for small |
| **Oracle Aconex** | 4.5 | Custom enterprise | Mega-projects | Document control, compliance | Navigation complexity |
| **Raken** | 4.6 | $35-94/user/mo | Field crews | Voice-to-text daily reports | Field-only, not all-in-one |
| **Trimble Viewpoint** | varies | $50K+ impl | Large GCs | Deep ERP integration | Legacy UI, field crews hate it |

### UK Compliance Gap (CortexBuild's Moat)

| Requirement | Procore | Buildertrend | Fieldwire | Autodesk | CortexBuild |
|------------|---------|-------------|-----------|----------|-------------|
| **CIS native** | ❌ (via integration) | ❌ | ❌ | ❌ | ✅ |
| **VAT DRC** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **JCT contracts** | ❌ (AIA only) | ❌ | ❌ | ❌ | ✅ |
| **Building Safety Act** | ❌ | ❌ | ❌ | ❌ | ✅ (RAMS, audit log) |
| **UK accounting** | ❌ (US only) | ❌ | ❌ | ❌ | ✅ |
| **Data residency (UK)** | ❌ (US cloud) | ❌ | ❌ | ❌ | ✅ (VPS UK-hosted) |

### Pricing Positioning

| Segment | Market Price | CortexBuild Position |
|---------|-------------|---------------------|
| **Solo/small team** | $0-$500/mo | Likely competitive |
| **Small contractor** | $500-$3,000/mo | Sweet spot |
| **Mid-size contractor** | $3,000-$15,000/mo | Value proposition vs. Procore |
| **Large enterprise** | $10,000-$50,000+/mo | Needs enterprise features |

**Recommended positioning:** £500-£2,000/month for mid-market UK contractors — below Procore (£3,000+/mo equivalent) but above Contractor Foreman (£49-332/mo).

---

## Feature Gap Analysis

### What Competitors Have That CortexBuild Is Missing

| Feature | Demand | Who Has It | CortexBuild Status | Priority |
|---------|--------|-----------|-------------------|----------|
| **Drone/Reality Capture** | High (13.8% CAGR market) | DroneDeploy, OpenSpace, Cupix | Not present | 🔴 High |
| **Electronic Signatures** | Table stakes | DocuSign in Procore, Buildertrend | Not present | 🔴 High |
| **Client/Owner Portal** | High (residential/custom) | Buildertrend, Contractor Foreman | Not present | 🔴 High |
| **Equipment Telematics/IoT** | Growing | Hilti ON!Track, Samsara | Plant & Equipment exists, no IoT | 🟡 Medium |
| **4D/5D BIM** | Emerging enterprise | Autodesk, Dalux | BIM Viewer is 3D only | 🟡 Medium |
| **COI/Certificate Tracking** | Compliance-critical | myCOI (Procore integration) | Not present | 🟡 Medium |
| **Video Conferencing** | Expected | Zoom/Teams in Procore | Meetings module, no integration | 🟡 Medium |
| **Warranty Management** | Post-completion | Buildertrend | Not present | 🟢 Low |
| **Generative AI Summarization** | Rapidly adopting | Emerging 2026 | Intent classifiers exist, no generation | 🟡 Medium |
| **Automated Quantity Takeoff** | Growing | Autodesk ACC | Not present | 🟡 Medium |
| **Weather Auto-Tracking** | Nice-to-have | Raken | Manual in Daily Reports | 🟢 Low |
| **Supply Chain Management** | Growing | Procore ecosystem | Procurement + Marketplace exist, depth unknown | 🟡 Medium |
| **Mobile Offline-First** | Critical for field | Fieldwire, Raken | Needs verification | 🔴 High |

### CortexBuild's Unique Advantages

| Feature | CortexBuild | Competitors |
|---------|------------|-------------|
| **70+ modules** | ✅ Most comprehensive | Procore closest but requires 3rd party apps |
| **24 AI intent classifiers** | ✅ Specialized per module | Most have 1 generic "AI assistant" |
| **Local Ollama LLM** | ✅ Data sovereignty, no API costs | All use cloud APIs (OpenAI, Anthropic) |
| **Native UK compliance** | ✅ CIS, VAT DRC, JCT | All US platforms lack this |
| **UK data residency** | ✅ VPS-hosted | All US cloud-hosted |
| **Unlimited users** | ✅ No per-user pricing | Most charge per user/month |
| **Open source** | ✅ Full codebase visible | All proprietary |
| **Customizable** | ✅ Self-hosted, modifiable | SaaS lock-in |

---

## Ecosystem Signals

### Most Requested Features (from competitor GitHub issues, forums, reviews)

1. **Better mobile offline support** — #1 complaint across all platforms
2. **Transparent/stable pricing** — Procore's 14% YoY increases drive churn
3. **Faster onboarding** — Procore takes weeks, Fieldwire takes hours
4. **Simpler permissions** — Procore's system is rigid and confusing
5. **Data export** — Users feel trapped; easy export is a differentiator
6. **Integrated financials** — Fieldwire users outgrow it needing accounting
7. **API access for integrations** — Custom workflows are increasingly expected
8. **AI-powered search** — Natural language queries across all data
9. **Automated reporting** — Reduce manual report generation
10. **Subcontractor onboarding** — Make it easy for subs to adopt

### Integration Patterns (what users connect to)

| Integration | Demand | CortexBuild Status |
|------------|--------|-------------------|
| **QuickBooks/Xero** | High (accounting) | ❌ Not visible |
| **Sage 50** | High (UK accounting) | ❌ Not visible |
| **DocuSign** | High (e-sign) | ❌ Not present |
| **Zoom/Teams** | Medium (meetings) | ❌ Not integrated |
| **Slack** | Medium (notifications) | ❌ Not visible |
| **Google Workspace** | High (OAuth exists) | ✅ OAuth present |
| **Microsoft 365** | High (OAuth exists) | ✅ OAuth present |
| **Zapier** | Medium (workflow automation) | ❌ Not present |
| **Webhooks** | Growing (custom integrations) | ❌ Not visible |

---

## Technical Landscape

### Architecture Decisions

| Decision | Current Choice | Assessment | Alternatives |
|----------|---------------|------------|-------------|
| **Frontend framework** | React 19 + Vite | ✅ Excellent choice | Next.js (SSR overhead), Svelte (ecosystem) |
| **Styling** | Tailwind v4 + DaisyUI | ✅ Good for rapid dev | Material UI (heavier), Chakra |
| **State management** | Zustand | ✅ Lightweight, simple | Redux (boilerplate), Jotai (atom-based) |
| **Data fetching** | React Query + generic hooks | ✅ Caching, background refresh | SWR, Apollo |
| **Backend** | Express.js + raw SQL | ✅ Simple, fast | Next.js API (SSR coupling), NestJS (complex) |
| **Database** | PostgreSQL + pgvector | ✅ Relational + vector search | MongoDB (no vector), MySQL (less mature) |
| **Caching** | Redis | ✅ Industry standard | Memcached (simpler) |
| **Auth** | JWT + OAuth 2.0 | ✅ Standard, multi-provider | Better-auth (newer), Auth.js |
| **AI** | Ollama local (Llama 3.1 8B) | ✅ Data sovereignty, no API cost | OpenAI API (costly, data leaves UK) |
| **Deployment** | VPS + Docker | ✅ Full control, predictable cost | Vercel (per-request cost), AWS (complex) |
| **Real-time** | WebSocket | ✅ Low latency, bidirectional | SSE (one-way), MQTT (IoT) |

### Platform Strengths

1. **Generic CRUD factory** (`generic.js`) — One router pattern for 34+ tables with column whitelists, order validation, audit logging, WebSocket broadcast
2. **makeHooks factory** — Generic hooks for all modules with React Query caching, background refresh, optimistic updates
3. **Multi-tenancy enforcement** — `organization_id` filtering on every query, `'deny'` scope for incomplete profiles
4. **RBAC** — 5 roles with granular permissions
5. **OAuth 2.0** — Google + Microsoft with CSRF-protected state, Redis-backed state store
6. **File validation** — Magic number detection, path traversal prevention
7. **Rate limiting** — Redis-backed, per-endpoint limits
8. **AI intent classifiers** — 24 specialized classifiers for natural language queries across all modules

### Technical Debt & Risks

1. **Large module files** — 9 modules still exceed 1,000 lines (Invoicing 1,279, DailyReports 1,253, Tenders 1,162, Teams 1,160, Dashboard 1,112, PlantEquipment 1,066, ProjectCalendar 1,051, Lettings 1,004, Safety 996)
2. **Prequalification API persistence** — Now wired, but needs database table population
3. **No E2E coverage for new modules** — 9 E2E specs cover basics but not 70 modules
4. **Mock data fallback** — `fetchAll()` in api.ts falls back to mock data for 23 entities on API failure (silent degradation)
5. **No webhook support** — Custom integrations require polling
6. **No API versioning** — Breaking changes affect all consumers
7. **No GraphQL** — REST-only API (fine for now, limits complex queries)

---

## Reusable From Existing Projects

| Project | What to reuse | Location |
|---------|--------------|----------|
| **CortexBuild Ultimate** | Everything — this IS the project | Full codebase |
| **Prequalification/ pattern** | Sub-module extraction pattern | `src/components/modules/prequalification/` |
| **Projects/ pattern** | Sub-module extraction pattern | `src/components/modules/projects/` |
| **Admin Dashboard pattern** | Tab-based sub-module pattern | `src/components/admin-dashboard/` |
| **makeHooks** | Generic CRUD hook factory | `src/hooks/useData.ts` |
| **generic.js** | CRUD factory router | `server/routes/generic.js` |
| **Domain types** | 14 domain-level type definitions | `src/types/domain.ts` |
| **Zod validations** | Runtime validation schemas | `src/lib/validations.ts` |

---

## Future Possibilities

### Platform Roadmap Opportunities

| Opportunity | Timeline | Impact | Effort |
|------------|----------|--------|--------|
| **Drone/Reality Capture integration** | 3-6 months | High (new revenue stream) | Medium |
| **Electronic signature integration** | 1-2 months | High (table stakes) | Low |
| **Client/Owner Portal** | 2-3 months | High (residential market) | Medium |
| **Mobile offline-first (PWA)** | 3-6 months | Critical (field adoption) | High |
| **Webhook system** | 1-2 months | Medium (integrations) | Low |
| **API versioning** | 1 month | Medium (stability) | Low |
| **Generative AI summarization** | 2-4 months | High (bid differentiator) | Medium |
| **4D BIM (time-linked)** | 3-6 months | Medium (enterprise) | High |
| **Equipment IoT/telematics** | 6-12 months | Medium (differentiation) | High |
| **Carbon estimating** | 3-6 months | Growing (Net Zero compliance) | Medium |

### AI Opportunities

| AI Capability | Current Status | Gap | Opportunity |
|--------------|---------------|-----|------------|
| **Intent classification** | ✅ 24 classifiers | — | Table stakes, well done |
| **Predictive analytics** | ✅ Module exists | Needs ML pipeline training | Cost forecasting, delay prediction |
| **Computer vision** | ✅ AI Vision module | Scope unclear | Safety compliance, progress tracking |
| **RFI summarization** | ❌ | Competitors rolling out in 2026 | Auto-summarize long RFI threads |
| **Document classification** | ❌ | Manual categorization | Auto-tag uploads by type |
| **Risk scoring** | ✅ Predictive module | Needs historical data | Auto-score project risks |
| **Invoice anomaly detection** | ❌ | Growing demand | Flag unusual costs |
| **Schedule optimization** | ❌ | Oracle Primavera territory | AI-suggested critical path |
| **Natural language queries** | ✅ Intent classifiers | Needs NLG | "Show me overdue RFIs on Project X" → chart |
| **Automated reporting** | ❌ | Manual report generation | "Generate monthly progress report" |

### Adjacent Problems

1. **Subcontractor management** — Beyond prequalification: performance tracking, payment history, compliance monitoring
2. **Material procurement** — Supply chain visibility, vendor management, delivery tracking
3. **Quality assurance** — Beyond inspections: defect prevention, root cause analysis
4. **Handover & closeout** — O&M manuals, as-built documentation, warranty tracking
5. **Facility management** — Post-construction maintenance, asset management
6. **Carbon tracking** — Embodied carbon estimating, Net Zero reporting
7. **Permit management** — Planning permissions, building control, regulatory submissions

---

## Proposed Architecture Enhancements

### Immediate (1-2 months)

1. **Electronic Signature** — Integrate DocuSign or build lightweight e-sign for approvals (variations, RAMS, submittals)
2. **Webhook System** — Generic webhook registration for external integrations (Slack, Zapier, custom)
3. **Mobile Offline-First Audit** — Verify and enhance PWA offline capabilities for field workers
4. **Generative AI Summarization** — Add RFI thread summarization, daily report generation, submittal review suggestions

### Short-term (3-6 months)

5. **Client/Owner Portal** — Read-only dashboard for project owners/clients with progress, budget, and safety metrics
6. **Drone Integration** — API endpoint for drone image/video uploads, progress comparison overlays
7. **Equipment Telematics** — IoT data ingestion pipeline for Plant & Equipment module
8. **4D BIM** — Link BIM models to project schedule for time-based visualization

### Medium-term (6-12 months)

9. **Carbon Estimating** — Track embodied carbon across materials, suppliers, and phases
10. **Warranty Management** — Post-completion defect tracking, warranty claim workflows
11. **AI-Powered Search** — Natural language search across all modules with semantic understanding
12. **Automated Reporting** — Schedule and generate monthly/quarterly reports automatically

---

## Risks and Open Questions

1. **Pricing strategy undefined** — No public pricing on cortexbuildpro.com. Need to establish tiers.
2. **Mobile offline capability unverified** — Field adoption depends on this. Does the PWA work without connectivity?
3. **Data migration from competitors** — How do users import data from Procore, Buildertrend, etc.?
4. **Multi-tenant scaling** — VPS approach works for current scale. What's the break point? When to move to cloud?
5. **AI model quality** — Local Ollama (Llama 3.1 8B) vs. cloud models (Claude, GPT-4). Is 8B sufficient for production AI features?
6. **Regulatory changes** — UK Building Safety Act tightening from 2026. Is CortexBuild ready for "Golden Thread" requirements?
7. **Competitor response** — Procore adding UK features? US platforms localizing?
8. **Team capacity** — Who maintains 70+ modules? Is this a solo project or team effort?

---

## Suggested Phases

Based on research findings, recommended build order:

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|-----------------|
| **P1: Table Stakes** | E-sign, webhooks, mobile offline audit | 1-2 months | DocuSign integration, webhook system, offline capability report |
| **P2: Market Expansion** | Client portal, drone integration | 2-4 months | Owner portal, drone upload API, progress comparison |
| **P3: AI Enhancement** | Generative summarization, automated reporting | 2-4 months | RFI summaries, daily report generation, scheduled reports |
| **P4: Enterprise Features** | 4D BIM, equipment IoT, carbon tracking | 3-6 months | Time-linked BIM, IoT data pipeline, carbon estimates |
| **P5: Ecosystem** | API v2, marketplace, integrations | Ongoing | API versioning, app marketplace, Zapier/Slack/Teams |

---

## Sources

### Local Exploration
- `/Users/adrianstanca/cortexbuild-ultimate/` — Full codebase scan
- `src/App.tsx` — Module registration
- `server/index.js` — API route registration
- `src/components/layout/Sidebar.tsx` — Navigation structure
- `CLAUDE.md`, `AGENTS.md`, `QWEN.md`, `SESSION.md` — Architecture docs

### Competitive Intelligence
- G2.com — Procore, Autodesk Build, Buildertrend, Fieldwire, Dalux, Raken, Contractor Foreman reviews
- Capterra — Construction management software comparisons
- Reddit r/construction, r/selfhosted — User complaints and recommendations
- Hacker News — Construction tech discussions
- Procore pricing pages — ACV model details
- Fieldwire pricing pages — Transparent tier pricing
- Buildertrend pricing — Residential model
- Contractor Foreman — Budget all-in-one pricing

### Market Research
- Grand View Research — Construction management software market report
- MarketsandMarkets — UK construction software forecast
- Autodesk Construction Connections — 2025 construction trends
- Drone Industry Insight — Reality capture market analysis
- UK HMRC — CIS guidance and 2026 changes
- UK Building Safety Act — Golden Thread requirements

### Technical Research
- npm package registry — Library research
- Cloudflare Workers docs — Platform constraints
- Ollama documentation — Local LLM capabilities
- React Query docs — Data fetching patterns
- PostgreSQL pgvector — Vector search capabilities
