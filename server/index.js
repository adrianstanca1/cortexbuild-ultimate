require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const path       = require('path');
const http       = require('http');
const authMiddleware = require('./middleware/auth');
const makeRouter     = require('./routes/generic');
const authRoutes     = require('./routes/auth');
const rateLimiter    = require('./middleware/rateLimiter');
const { initWebSocket } = require('./lib/websocket');

const app  = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket server
initWebSocket(server);

// ─── Security middleware ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'"],
      objectSrc:  ["'none'"],
      frameSrc:   ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ─── Middleware ───────────────────────────────────────────────────────────────
// CORS: only allow configured origins — never default to '*' in production
const corsOrigin = process.env.CORS_ORIGIN;
if (!corsOrigin) {
  console.warn('[CORS] CORS_ORIGIN not set — restrict to specific origins for production');
}
app.use(cors({
  origin: corsOrigin || false,   // deny all if not configured
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);

// ─── Static file serving for uploads ─────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Public routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// ─── JWT auth on all other /api routes ───────────────────────────────────────
  app.use('/api/metrics',       require('./routes/metrics'));
app.use('/api', authMiddleware);

// ─── Upload route ─────────────────────────────────────────────────────────────
app.use('/api/files',           require('./routes/files'));
app.use('/api/project-images',  require('./routes/project-images'));
app.use('/api/project-tasks',   require('./routes/project-tasks'));

// ─── AI routes ────────────────────────────────────────────────────────────────
app.use('/api/ai', require('./routes/ai'));

app.use('/api/ai-conversations', require('./routes/ai-conversations'));

// ─── CRUD routes ─────────────────────────────────────────────────────────────
app.use('/api/projects',        makeRouter('projects'));
app.use('/api/invoices',        makeRouter('invoices'));
app.use('/api/safety',          makeRouter('safety_incidents'));
app.use('/api/rfis',            makeRouter('rfis'));
app.use('/api/change-orders',   makeRouter('change_orders'));
app.use('/api/team',            makeRouter('team_members'));
app.use('/api/equipment',       makeRouter('equipment'));
app.use('/api/subcontractors',  makeRouter('subcontractors'));
app.use('/api/documents',       makeRouter('documents'));
app.use('/api/timesheets',      makeRouter('timesheets'));
app.use('/api/meetings',        makeRouter('meetings'));
app.use('/api/materials',       makeRouter('materials'));
app.use('/api/punch-list',      makeRouter('punch_list'));
app.use('/api/inspections',     makeRouter('inspections'));
app.use('/api/rams',            makeRouter('rams'));
app.use('/api/cis',             makeRouter('cis_returns'));
app.use('/api/tenders',         makeRouter('tenders'));
app.use('/api/tenders/ai',     require('./routes/tender-ai'));
app.use('/api/contacts',        makeRouter('contacts'));
app.use('/api/risk-register',   makeRouter('risk_register'));
app.use('/api/purchase-orders', makeRouter('purchase_orders'));
app.use('/api/daily-reports',   makeRouter('daily_reports'));
app.use('/api/reports',         require('./routes/daily-reports-summary'));

// New construction module routes
app.use('/api/variations',         makeRouter('variations'));
app.use('/api/defects',            makeRouter('defects'));
app.use('/api/valuations',         makeRouter('valuations'));
app.use('/api/specifications',     makeRouter('specifications'));
app.use('/api/temp-works',         makeRouter('temp_works'));
app.use('/api/signage',            makeRouter('signage'));
app.use('/api/waste-management',   makeRouter('waste_management'));
app.use('/api/sustainability',     makeRouter('sustainability'));
app.use('/api/training',            makeRouter('training'));
app.use('/api/certifications',     makeRouter('certifications'));
app.use('/api/prequalification',   makeRouter('prequalification'));
app.use('/api/lettings',            makeRouter('lettings'));
app.use('/api/measuring',          makeRouter('measuring'));
app.use('/api/notifications',   require('./routes/notifications'));
app.use('/api/team-member-data', require('./routes/team-member-data'));
app.use('/api/site-permits',         makeRouter('site_permits'));
app.use('/api/equipment-service-logs', makeRouter('equipment_service_logs'));
app.use('/api/equipment-hire-logs',   makeRouter('equipment_hire_logs'));
app.use('/api/risk-mitigation-actions', makeRouter('risk_mitigation_actions'));
app.use('/api/contact-interactions',    makeRouter('contact_interactions'));
app.use('/api/safety-permits',         makeRouter('safety_permits'));
app.use('/api/toolbox-talks',          makeRouter('toolbox_talks'));
app.use('/api/drawing-transmittals',  makeRouter('drawing_transmittals'));
app.use('/api/analytics-data',       require('./routes/analytics-data'));
app.use('/api/dashboard-data',     require('./routes/dashboard-data'));
app.use('/api/financial-reports', require('./routes/financial-reports'));
app.use('/api/executive-reports', require('./routes/executive-reports'));
app.use('/api/search',          require('./routes/search'));
app.use('/api/audit',           require('./routes/audit'));
app.use('/api/calendar',        require('./routes/calendar'));
app.use('/api/email',          require('./routes/email'));
app.use('/api/insights',         require('./routes/insights'));
app.use('/api/weather-forecast', require('./routes/weather-data'));
app.use('/api/backup',         require('./routes/backup'));
app.use('/api/report-templates', require('./routes/report-templates'));
app.use('/api/permissions',    require('./routes/permissions'));

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🏗  CortexBuild API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws\n`);
});
