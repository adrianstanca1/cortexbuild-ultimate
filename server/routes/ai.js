const express = require('express');
const pool    = require('../db');
const https = require('https');
const http = require('http');
const auth   = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { RedisStore: RateLimitRedisStore } = require('rate-limit-redis');
const redis = require('../db');
const { broadcastDashboardUpdate, broadcastNotification } = require('../lib/ws-broadcast');

// Import modular intent handlers
const { handleProjects } = require('./ai-intents/projects-intent');
const { handleInvoices, handleOverdue } = require('./ai-intents/invoices-intent');
const { handleSafety } = require('./ai-intents/safety-intent');
const { handleTeam } = require('./ai-intents/team-intent');
const { handleRfis } = require('./ai-intents/rfis-intent');
const { handleTenders } = require('./ai-intents/tenders-intent');
const { handleBudget } = require('./ai-intents/budget-intent');
const { handleValuations } = require('./ai-intents/valuations-intent');
const { handleDefects } = require('./ai-intents/defects-intent');
const { handleMaterials } = require('./ai-intents/materials-intent');
const { handleTimesheets } = require('./ai-intents/timesheets-intent');
const { handleSubcontractors } = require('./ai-intents/subcontractors-intent');
const { handleEquipment } = require('./ai-intents/equipment-intent');
const { handleChangeOrders } = require('./ai-intents/change-orders-intent');
const { handlePurchaseOrders } = require('./ai-intents/purchase-orders-intent');
const { handleContacts } = require('./ai-intents/contacts-intent');
const { handleRams } = require('./ai-intents/rams-intent');
const { handleCIS } = require('./ai-intents/cis-intent');
const { handleDailyReports } = require('./ai-intents/daily-reports-intent');
const { handleRisk } = require('./ai-intents/risk-intent');
const { handleGenerateReport } = require('./ai-intents/report-generator');
const { classify, shouldUseOllama } = require('./ai-intents/ai-intent-classifier');
const { getConversationHistory, truncateToTokenBudget, MAX_CONTEXT_MESSAGES, SUMMARY_THRESHOLD, MAX_TOKENS_BUDGET } = require('./ai-intents/conversation-history');
const { getOllamaResponse, summarizeText, OLLAMA_HOST, LLM_MODEL } = require('./ai-intents/ollama-client');

const router = express.Router();

// Rate limiters for AI endpoints
const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: { message: 'Too many AI requests, please wait a moment before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiExecuteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 execute requests per minute (write actions)
  message: { message: 'Too many AI actions, please wait a moment before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiSummarizeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 summarize requests per minute
  message: { message: 'Too many summary requests, please wait a moment before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(auth);

// ─── Ollama health check ──────────────────────────────────────────────────────

/**
 * GET /api/ai/status
 * Returns Ollama connectivity status and available models.
 */
router.get('/status', async (req, res) => {
  const start = Date.now();
  const result = {
    ollama: {
      reachable: false,
      latencyMs: null,
      host: OLLAMA_HOST,
      model: LLM_MODEL,
      error: null,
    },
    capabilities: {
      chat: false,
      summarise: false,
      embeddings: false,
    }
  };

  // Check basic connectivity (HTTP request to Ollama root)
  try {
    await new Promise((resolve, reject) => {
      const url = new URL(OLLAMA_HOST);
      const lib = url.protocol === 'https:' ? https : http;
      const req = lib.request({
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 11434),
        path: '/',
        method: 'GET',
        timeout: 5000,
      }, (res) => {
        result.ollama.reachable = res.statusCode < 500;
        resolve();
      });
      req.on('error', (e) => { result.ollama.error = e.message; reject(e); });
      req.on('timeout', () => { result.ollama.error = 'Connection timed out'; req.destroy(); reject(new Error('timeout')); });
      req.end();
    });
  } catch (err) {
    result.ollama.error = err.message;
    result.ollama.reachable = false;
  }

  result.ollama.latencyMs = Date.now() - start;

  // If reachable, check /api/tags for available models
  if (result.ollama.reachable) {
    try {
      await new Promise((resolve, reject) => {
        const url = new URL(OLLAMA_HOST + '/api/tags');
        const lib = url.protocol === 'https:' ? https : http;
        const req = lib.request({
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 11434),
          path: '/api/tags',
          method: 'GET',
          timeout: 8000,
        }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              result.capabilities.chat = (parsed.models || []).some(m => m.name === LLM_MODEL || m.name.includes('qwen') || m.name.includes('llama'));
              result.capabilities.summarise = result.capabilities.chat;
            } catch (parseErr) {
              console.error('[AI Health] Failed to parse Ollama models response:', parseErr.message);
            }
            resolve();
          });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.end();
      });
    } catch (checkErr) {
      result.ollama.error = result.ollama.error || `Model check failed: ${checkErr.message}`;
    }
  }

  // Determine overall health
  const healthy = result.ollama.reachable && (result.capabilities.chat || result.capabilities.summarise);
  const status = healthy ? 'healthy' : result.ollama.reachable ? 'degraded' : 'offline';

  res.status(healthy ? 200 : result.ollama.reachable ? 200 : 503).json({
    status,
    ...result,
    recommendation: !result.ollama.reachable
      ? 'Ollama is offline. Rule-based responses will be used. Start Ollama: `ollama serve`'
      : !result.capabilities.chat
      ? `Model "${LLM_MODEL}" not found on Ollama. Install: \`ollama pull ${LLM_MODEL}\``
      : 'All systems operational.',
  });
});

// ─── Helper: handle unknown intent ────────────────────────────────────────────

function handleUnknown(message) {
  return {
    reply: `I didn't quite understand "${message}", but here's what I can help you with:\n\n• **Projects** — status, progress, budgets\n• **Invoices / Payments** — outstanding, overdue amounts\n• **Safety** — incidents, hazards, open investigations\n• **Team / Workers / Staff** — headcount, trades, hours\n• **RFIs** — open requests, priorities, deadlines\n• **Tenders / Bids** — pipeline, probabilities\n• **Overdue** — overdue invoices\n• **Budget** — total budget vs spend across all projects\n• **Materials** — stock, deliveries, suppliers\n• **Timesheets** — hours, payroll, overtime\n• **Subcontractors** — trades, CIS, insurance\n• **Equipment** — plant, machinery, hire\n• **Change Orders / Variations** — status, values\n• **Purchase Orders** — procurement, deliveries\n• **Contacts / CRM** — clients, prospects, suppliers\n• **RAMS** — method statements, risk assessments\n• **CIS** — construction industry scheme returns\n• **Daily Reports** — site diary, progress\n• **Risk Register** — hazards, risk scores\n\nTry asking something like "Show me all projects" or "What invoices are overdue?"`,
    data: null,
    suggestions: [
      'Show me all projects',
      'What invoices are overdue?',
      'Show me open safety incidents'
    ]
  };
}

// ─── POST /chat ───────────────────────────────────────────────────────────────

router.post('/chat', aiChatLimiter, async (req, res) => {
  const { message, context, sessionId } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: 'message is required' });
  }

  try {
    // ── Fetch conversation history (with summarization for long chats) ──────
    let convHistory = [];
    let summary      = null;
    if (sessionId && req.user && req.user.organization_id) {
      try {
        const orgId = req.user.organization_id || 'anon';
        const hist = await getConversationHistory(orgId, sessionId);
        convHistory = hist.messages;
        summary     = hist.summary;
      } catch (e) {
        console.warn('[AI] Could not load conversation history:', e.message);
      }
    }

    const intents = classify(message.trim());
    let result;

    if (intents.length === 0 || (intents.length === 1 && intents[0] === 'unknown')) {
      result = handleUnknown(message.trim());
    } else if (intents.length > 1) {
      const { handleCrossModule } = require('./ai-intents/cross-module-intent');
      result = await handleCrossModule(intents, message.trim(), req.user);
    } else {
      const intent = intents[0];
      const user = req.user;
      switch (intent) {
        case 'projects':        result = await handleProjects(user);        break;
        case 'invoices':        result = await handleInvoices(user);        break;
        case 'overdue':         result = await handleOverdue(user);         break;
        case 'safety':          result = await handleSafety(user);          break;
        case 'team':            result = await handleTeam(user);            break;
        case 'rfis':            result = await handleRfis(user);            break;
        case 'tenders':         result = await handleTenders(user);         break;
        case 'budget':          result = await handleBudget(user);          break;
        case 'valuations':     result = await handleValuations(user);       break;
        case 'defects':        result = await handleDefects(user);          break;
        case 'materials':       result = await handleMaterials(user);       break;
        case 'timesheets':      result = await handleTimesheets(user);      break;
        case 'subcontractors':  result = await handleSubcontractors(user);  break;
        case 'equipment':       result = await handleEquipment(user);       break;
        case 'change_orders':   result = await handleChangeOrders(user);    break;
        case 'purchase_orders': result = await handlePurchaseOrders(user);  break;
        case 'contacts':        result = await handleContacts(user);    break;
        case 'rams':            result = await handleRams(user);        break;
        case 'cis':             result = await handleCIS(user);         break;
        case 'daily_reports':   result = await handleDailyReports(user); break;
        case 'risk':            result = await handleRisk(user);        break;
        case 'report':          result = await handleGenerateReport(message.trim()); break;
        default:
          result = handleUnknown(message.trim());
          break;
      }
    }

    let reply = result.reply;
    let useLLM = false;

    if (shouldUseOllama(message.trim(), intents[0])) {

      try {
        reply = await getOllamaResponse(message.trim(), result.reply, convHistory, summary);
        useLLM = true;
      } catch (llmErr) {
        console.warn('[AI] Ollama unavailable, using rule-based fallback:', llmErr.message);
        // Append a note so the user knows AI reasoning wasn't used
        if (reply && !reply.includes('(AI unavailable')) {
          reply = reply + '\n\n_Note: AI reasoning is currently unavailable (Ollama is offline). Showing rule-based summary._';
        }
      }
    }

    // ── Save conversation to DB ─────────────────────────────────────────────
    if (sessionId && req.user) {
      const orgId = req.user.organization_id || 'anon';
      const uid = req.user.id || null;
      try {
        await pool.query(
          `INSERT INTO ai_conversations (organization_id, user_id, session_id, role, content, model)
           VALUES ($1, $2, $3, 'user', $4, $5)`,
          [orgId, uid, sessionId, message.trim(), LLM_MODEL]
        );
      } catch (e) {
        console.warn('[AI] Could not save user message:', e.message);
      }
      try {
        await pool.query(
          `INSERT INTO ai_conversations (organization_id, user_id, session_id, role, content, model)
           VALUES ($1, $2, $3, 'assistant', $4, $5)`,
          [orgId, uid, sessionId, reply, LLM_MODEL]
        );
      } catch (e) {
        console.warn('[AI] Could not save assistant message:', e.message);
      }
    }

    res.json({
      reply,
      data: result.data ?? null,
      suggestions: result.suggestions,
      source: useLLM ? 'ollama' : 'rule-based',
      hasHistory: convHistory.length > 0,
      hasSummary: !!summary,
    });
  } catch (err) {
    console.error('[AI /chat]', err.message);
    res.status(500).json({ message: 'AI assistant encountered an error: ' + err.message });
  }
});

// ─── POST /summarize-project ─────────────────────────────────────────────────
// Returns a concise AI summary of a specific project
router.post('/summarize-project', aiSummarizeLimiter, async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: 'projectId is required' });

  const orgId  = req.user?.organization_id;
  const isSuper = ['super_admin', 'company_owner'].includes(req.user?.role);

  try {
    const { rows: projects } = await pool.query(
      `SELECT name, client, status, progress, budget, spent, manager, location, type, description, start_date, end_date
       FROM projects WHERE id = $1 ${orgId && !isSuper ? 'AND organization_id = $2' : ''} LIMIT 1`,
      orgId && !isSuper ? [projectId, orgId] : [projectId]
    );
    if (!projects.length) return res.status(404).json({ error: 'Project not found' });

    const proj = projects[0];

    // Gather related data in parallel (scoped to project's organization)
    const projOrgId = projects[0].organization_id || orgId;
    const [{ rows: invoices }, { rows: changeOrders }, { rows: defects }, { rows: rfis }, { rows: dailyReports }] =
      await Promise.all([
        pool.query(`SELECT number, amount, status, due_date FROM invoices WHERE project_id = $1 AND organization_id = $2`, [projectId, projOrgId]),
        pool.query(`SELECT number, title, amount, status FROM change_orders WHERE project_id = $1 AND organization_id = $2`, [projectId, projOrgId]),
        pool.query(`SELECT reference, title, priority, status, due_date FROM defects WHERE project_id = $1 AND organization_id = $2`, [projectId, projOrgId]),
        pool.query(`SELECT number, subject, priority, status FROM rfis WHERE project_id = $1 AND organization_id = $2`, [projectId, projOrgId]),
        pool.query(`SELECT date, weather, workers_on_site, progress FROM daily_reports WHERE project_id = $1 AND organization_id = $2 ORDER BY date DESC LIMIT 7`, [projectId, projOrgId]),
      ]);

    const totalInvoiced = invoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const paidInvoices  = invoices.filter(i => i.status === 'paid').length;
    const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
    const openDefects  = defects.filter(d => d.status === 'open' || d.status === 'in_progress').length;
    const openRfis     = rfis.filter(r => r.status !== 'closed').length;
    const avgWorkers   = dailyReports.length
      ? (dailyReports.reduce((s, d) => s + parseFloat(d.workers_on_site || 0), 0) / dailyReports.length).toFixed(1)
      : 'N/A';

    const context = `
Project: ${proj.name}
Client: ${proj.client || 'N/A'}
Status: ${proj.status} | Progress: ${proj.progress ?? 0}%
Budget: £${parseFloat(proj.budget || 0).toLocaleString('en-GB')} | Spent: £${parseFloat(proj.spent || 0).toLocaleString('en-GB')} (${proj.budget > 0 ? Math.round((proj.spent / proj.budget) * 100) : 0}%)
Manager: ${proj.manager || 'N/A'} | Location: ${proj.location || 'N/A'}
Type: ${proj.type || 'N/A'} | Start: ${proj.start_date || 'N/A'} | End: ${proj.end_date || 'N/A'}
Description: ${proj.description || 'None'}
Financial: ${invoices.length} invoices totalling £${totalInvoiced.toLocaleString('en-GB')}, ${paidInvoices} paid, ${overdueInvoices} overdue
Change Orders: ${changeOrders.length} total
Defects: ${defects.length} total, ${openDefects} open
RFIs: ${rfis.length} total, ${openRfis} open
Daily Reports: ${dailyReports.length} recent | Avg workers on site: ${avgWorkers}
`.trim();

    try {
      const summary = await summarizeText(
        `Summarise this construction project in 3-4 sentences for a non-technical stakeholder:\n\n${context}`
      );
      res.json({
        summary,
        projectId,
        projectName: proj.name,
        stats: {
          progress: proj.progress ?? 0,
          budgetUtilization: proj.budget > 0 ? Math.round((proj.spent / proj.budget) * 100) : 0,
          totalInvoiced,
          paidInvoices,
          overdueInvoices,
          totalChangeOrders: changeOrders.length,
          openDefects,
          openRfis,
          avgWorkersOnSite: avgWorkers === 'N/A' ? null : parseFloat(avgWorkers),
        }
      });
    } catch (ollamaErr) {
      // Fallback to rule-based summary
      const budgetPct = proj.budget > 0 ? Math.round((proj.spent / proj.budget) * 100) : 0;
      const summary = `"${proj.name}" is a ${proj.type || 'construction'} project for ${proj.client || 'an undisclosed client'}, currently ${proj.status} at ${proj.progress ?? 0}% completion. ` +
        `Budget utilisation is ${budgetPct}% (£${parseFloat(proj.spent || 0).toLocaleString('en-GB')} of £${parseFloat(proj.budget || 0).toLocaleString('en-GB')}). ` +
        `There are ${openRfis} open RFIs, ${openDefects} open defects, and ${overdueInvoices} overdue invoice(s).`;
      res.json({ summary, projectId, projectName: proj.name, source: 'rule-based' });
    }
  } catch (err) {
    console.error('[AI /summarize-project]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /execute ────────────────────────────────────────────────────────────
// Action execution: { action, params } → { success, message, data }
router.post('/execute', aiExecuteLimiter, async (req, res) => {
  const { action, params = {} } = req.body;
  if (!action) return res.status(400).json({ success: false, message: 'action is required' });

  try {
    switch (action) {
      // Require organization_id for all write actions
      if (!req.user?.organization_id) {
        return res.status(400).json({ success: false, message: 'User profile incomplete — organization membership required.' });
      }

      case 'create_project': {
        const { name, client, budget, status = 'active', type = 'construction', manager, location } = params;
        if (!name || !client) return res.status(400).json({ success: false, message: 'name and client are required' });
        const { rows } = await pool.query(
          `INSERT INTO projects(name,client,budget,status,type,manager,location,progress,spent,organization_id,company_id)
           VALUES($1,$2,$3,$4,$5,$6,$7,0,0,$8,$9) RETURNING id,name,status`,
          [name, client, Number(budget) || 0, status, type, manager || null, location || null, req.user.organization_id, req.user.company_id || null]
        );
        broadcastDashboardUpdate('create', 'projects', rows[0]);
        broadcastNotification('New Project Created', `"${name}" has been added to the project register.`, 'info', { projectId: rows[0].id, projectName: name });
        res.json({ success: true, message: `Project "${name}" created.`, data: rows[0] });
        break;
      }

      case 'update_project_status': {
        const { project_id, status } = params;
        if (!project_id || !status) return res.status(400).json({ success: false, message: 'project_id and status are required' });
        const { rows } = await pool.query(
          `UPDATE projects SET status=$1, updated_at=NOW() WHERE id=$2 AND organization_id = $3 RETURNING id,name,status`,
          [status, project_id, req.user.organization_id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Project not found or access denied' });
        broadcastDashboardUpdate('update', 'projects', rows[0]);
        broadcastNotification('Project Status Updated', `Project "${rows[0].name}" status changed to ${status}.`, 'info', { projectId: project_id });
        res.json({ success: true, message: `Project status updated to "${status}".`, data: rows[0] });
        break;
      }

      case 'update_invoice_status': {
        const { invoice_id, status } = params;
        if (!invoice_id || !status) return res.status(400).json({ success: false, message: 'invoice_id and status are required' });
        const { rows } = await pool.query(
          `UPDATE invoices SET status=$1, updated_at=NOW() WHERE id=$2 AND organization_id = $3 RETURNING id,number,status`,
          [status, invoice_id, req.user.organization_id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Invoice not found' });
        broadcastDashboardUpdate('update', 'invoices', rows[0]);
        res.json({ success: true, message: `Invoice "${rows[0].number}" status updated to "${status}".`, data: rows[0] });
        break;
      }

      case 'create_rfi': {
        const { project, subject, priority = 'medium', status: rfiStatus = 'open' } = params;
        if (!project || !subject) return res.status(400).json({ success: false, message: 'project and subject are required' });
        const { rows } = await pool.query(
          `INSERT INTO rfis(project,subject,priority,status,organization_id,company_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,number,status`,
          [project, subject, priority, rfiStatus, req.user.organization_id, req.user.company_id || null]
        );
        broadcastDashboardUpdate('create', 'rfis', rows[0]);
        broadcastNotification('New RFI Raised', `${rows[0].number}: ${subject}`, 'info', { projectId: project });
        res.json({ success: true, message: `RFI created: ${rows[0].number}`, data: rows[0] });
        break;
      }

      case 'create_safety_incident': {
        const { project, title, type, severity = 'medium', status: incStatus = 'open' } = params;
        if (!project || !title) return res.status(400).json({ success: false, message: 'project and title are required' });
        const { rows } = await pool.query(
          `INSERT INTO safety_incidents(project,title,type,severity,status,date,organization_id,company_id)
           VALUES($1,$2,$3,$4,$5,NOW(),$6,$7) RETURNING id,title,severity,status`,
          [project, title, type || 'incident', severity, incStatus, req.user.organization_id, req.user.company_id || null]
        );
        broadcastDashboardUpdate('create', 'safety_incidents', rows[0]);
        broadcastNotification('Safety Incident Recorded', `"${title}" — severity: ${severity}`, severity === 'critical' || severity === 'high' ? 'critical' : 'warning', { projectId: project });
        res.json({ success: true, message: `Safety incident recorded: "${title}"`, data: rows[0] });
        break;
      }

      case 'add_team_member': {
        const { name, role, trade, status: tmStatus = 'active' } = params;
        if (!name) return res.status(400).json({ success: false, message: 'name is required' });
        const { rows } = await pool.query(
          `INSERT INTO team_members(name,role,trade,status,organization_id,company_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,name,role,status`,
          [name, role || null, trade || null, tmStatus, req.user.organization_id, req.user.company_id || null]
        );
        broadcastDashboardUpdate('create', 'team_members', rows[0]);
        broadcastNotification('New Team Member Added', `${name} has joined the team as ${role || 'member'}.`, 'info', { memberId: rows[0].id });
        res.json({ success: true, message: `Team member "${name}" added.`, data: rows[0] });
        break;
      }

      case 'update_rfi_status': {
        const { rfi_id, status } = params;
        if (!rfi_id || !status) return res.status(400).json({ success: false, message: 'rfi_id and status are required' });
        const { rows } = await pool.query(
          `UPDATE rfis SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING id,number,status`,
          [status, rfi_id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'RFI not found' });
        res.json({ success: true, message: `RFI "${rows[0].number}" status updated.`, data: rows[0] });
        break;
      }

      case 'create_contact': {
        const { name, company, email, role, type = 'client' } = params;
        if (!name) return res.status(400).json({ success: false, message: 'name is required' });
        const { rows } = await pool.query(
          `INSERT INTO contacts(name,company,email,role,type,status,organization_id,company_id) VALUES($1,$2,$3,$4,$5,'active',$6,$7) RETURNING id,name,company`,
          [name, company || null, email || null, role || null, type, req.user.organization_id, req.user.company_id || null]
        );
        res.json({ success: true, message: `Contact "${name}" created.`, data: rows[0] });
        break;
      }

      case 'summarize_project': {
        const { projectId } = params;
        if (!projectId) return res.status(400).json({ success: false, message: 'projectId is required' });
        const orgId  = req.user?.organization_id;
        const isSuper = ['super_admin', 'company_owner'].includes(req.user?.role);
        const { rows } = await pool.query(
          `SELECT name, client, status, progress, budget, spent, manager, description
           FROM projects WHERE id = $1 ${orgId && !isSuper ? 'AND organization_id = $2' : ''} LIMIT 1`,
          orgId && !isSuper ? [projectId, orgId] : [projectId]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Project not found' });
        const p = rows[0];
        const budgetPct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
        const summary = `"${p.name}" is currently ${p.status} at ${p.progress ?? 0}% completion. ` +
          `Budget utilisation is ${budgetPct}% (£${parseFloat(p.spent || 0).toLocaleString('en-GB')} of £${parseFloat(p.budget || 0).toLocaleString('en-GB')}). ` +
          `Managed by ${p.manager || 'no assigned manager'}.`;
        res.json({ success: true, message: summary, data: rows[0] });
        break;
      }

      default:
        res.status(400).json({ success: false, message: `Unknown action: "${action}". Supported: create_project, update_project_status, update_invoice_status, create_rfi, create_safety_incident, add_team_member, update_rfi_status, create_contact.` });
    }
  } catch (err) {
    console.error('[AI /execute]', err.message);
    res.status(500).json({ success: false, message: 'Action failed: ' + err.message });
  }
});

module.exports = router;
