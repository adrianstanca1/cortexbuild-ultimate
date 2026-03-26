const express = require('express');
const pool    = require('../db');
const https = require('https');
const http = require('http');
const textwrap = require('textwrap');

const router = express.Router();

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const LLM_MODEL = process.env.LLM_MODEL || 'qwen3.5:latest';

function fmt(n) {
  if (n == null) return '£0';
  return '£' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function pct(spent, budget) {
  if (!budget || budget == 0) return '0';
  return ((spent / budget) * 100).toFixed(1);
}

// ─── Intent handlers ──────────────────────────────────────────────────────────

async function handleProjects() {
  const { rows } = await pool.query(
    `SELECT name, client, status, progress, budget, spent, manager, location FROM projects ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No projects found in the database.',
      data: { count: 0 },
      suggestions: [
        'Show me overdue invoices',
        'How many team members do we have?',
        'Show me open RFIs'
      ]
    };
  }
  const active     = rows.filter(r => r.status === 'active' || r.status === 'in_progress').length;
  const completed  = rows.filter(r => r.status === 'completed').length;
  const totalBudget = rows.reduce((s, r) => s + (parseFloat(r.budget) || 0), 0);
  const totalSpent  = rows.reduce((s, r) => s + (parseFloat(r.spent)  || 0), 0);

  let reply = `You have **${rows.length} projects** in total — ${active} active, ${completed} completed.\n`;
  reply += `Combined budget: ${fmt(totalBudget)} | Spent so far: ${fmt(totalSpent)} (${pct(totalSpent, totalBudget)}%).\n\n`;
  reply += 'Projects:\n';
  rows.slice(0, 8).forEach(p => {
    reply += `• ${p.name} (${p.client}) — ${p.status}, ${p.progress ?? 0}% complete, budget ${fmt(p.budget)}\n`;
  });
  if (rows.length > 8) reply += `…and ${rows.length - 8} more.\n`;

  return {
    reply,
    data: { count: rows.length, active, completed, totalBudget, totalSpent, projects: rows },
    suggestions: [
      'Show me the budget breakdown across projects',
      'Which projects are over budget?',
      'Show me overdue invoices'
    ]
  };
}

async function handleInvoices() {
  const { rows } = await pool.query(
    `SELECT number, client, project, amount, status, due_date FROM invoices ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No invoices found.',
      data: { count: 0 },
      suggestions: ['Show me all projects', 'What is our current budget?', 'Show me team members']
    };
  }
  const overdue  = rows.filter(r => r.status === 'overdue');
  const paid     = rows.filter(r => r.status === 'paid');
  const pending  = rows.filter(r => r.status === 'pending' || r.status === 'sent');
  const totalAmt  = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const overdueAmt = overdue.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  let reply = `You have **${rows.length} invoices** — ${paid.length} paid, ${pending.length} pending, ${overdue.length} overdue.\n`;
  reply += `Total invoiced: ${fmt(totalAmt)} | Overdue amount: ${fmt(overdueAmt)}.\n\n`;
  if (overdue.length) {
    reply += 'Overdue invoices:\n';
    overdue.slice(0, 5).forEach(i => {
      reply += `• ${i.number} — ${i.client} (${i.project}) ${fmt(i.amount)}, due ${i.due_date ? new Date(i.due_date).toLocaleDateString('en-GB') : 'N/A'}\n`;
    });
  }

  return {
    reply,
    data: { count: rows.length, paid: paid.length, pending: pending.length, overdue: overdue.length, totalAmt, overdueAmt, invoices: rows },
    suggestions: [
      'Show me only overdue invoices',
      'What is the total amount outstanding?',
      'Show me all projects'
    ]
  };
}

async function handleOverdue() {
  const { rows } = await pool.query(
    `SELECT number, client, project, amount, due_date FROM invoices WHERE status = 'overdue' ORDER BY due_date ASC`
  );
  if (!rows.length) {
    return {
      reply: 'Great news — there are no overdue invoices at the moment.',
      data: { count: 0 },
      suggestions: ['Show all invoices', 'Show me project summaries', 'Check team members']
    };
  }
  const total = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  let reply = `There are **${rows.length} overdue invoices** totalling ${fmt(total)}:\n\n`;
  rows.forEach(i => {
    reply += `• ${i.number} — ${i.client} (${i.project}) ${fmt(i.amount)}, was due ${i.due_date ? new Date(i.due_date).toLocaleDateString('en-GB') : 'N/A'}\n`;
  });
  reply += `\nRecommended action: send payment reminders to all clients with overdue balances.`;

  return {
    reply,
    data: { count: rows.length, total, invoices: rows },
    suggestions: [
      'Show all invoices',
      'Show me project cash positions',
      'How is our overall budget tracking?'
    ]
  };
}

async function handleSafety() {
  const { rows } = await pool.query(
    `SELECT type, title, severity, status, project, date FROM safety_incidents ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No safety incidents recorded — great news!',
      data: { count: 0 },
      suggestions: ['Show me all projects', 'Show RFIs', 'Check team members']
    };
  }
  const open     = rows.filter(r => r.status === 'open' || r.status === 'investigating');
  const closed   = rows.filter(r => r.status === 'closed' || r.status === 'resolved');
  const high     = rows.filter(r => r.severity === 'high' || r.severity === 'critical');

  let reply = `There are **${rows.length} safety incidents** on record — ${open.length} open/investigating, ${closed.length} resolved.\n`;
  reply += `High/critical severity: ${high.length}.\n\n`;
  if (open.length) {
    reply += 'Open incidents:\n';
    open.slice(0, 6).forEach(i => {
      reply += `• [${i.severity?.toUpperCase()}] ${i.title} — ${i.project}, ${i.date ? new Date(i.date).toLocaleDateString('en-GB') : 'N/A'}\n`;
    });
  }

  return {
    reply,
    data: { count: rows.length, open: open.length, closed: closed.length, highSeverity: high.length, incidents: rows },
    suggestions: [
      'Show me open safety incidents',
      'Which projects have the most incidents?',
      'Generate a safety summary report'
    ]
  };
}

async function handleTeam() {
  const { rows } = await pool.query(
    `SELECT name, role, trade, status, cis_status, hours_this_week FROM team_members ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No team members found.',
      data: { count: 0 },
      suggestions: ['Show me all projects', 'Show invoices', 'Show safety incidents']
    };
  }
  const active    = rows.filter(r => r.status === 'active');
  const cisVer    = rows.filter(r => r.cis_status === 'verified');
  const totalHrs  = rows.reduce((s, r) => s + (parseFloat(r.hours_this_week) || 0), 0);

  let reply = `You have **${rows.length} team members** — ${active.length} active.\n`;
  reply += `CIS verified: ${cisVer.length} | Total hours this week: ${totalHrs.toFixed(0)}.\n\n`;
  const trades = {};
  rows.forEach(r => { if (r.trade) trades[r.trade] = (trades[r.trade] || 0) + 1; });
  const topTrades = Object.entries(trades).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (topTrades.length) {
    reply += 'Trades breakdown:\n';
    topTrades.forEach(([t, n]) => { reply += `• ${t}: ${n}\n`; });
  }

  return {
    reply,
    data: { count: rows.length, active: active.length, cisVerified: cisVer.length, totalHoursThisWeek: totalHrs, members: rows },
    suggestions: [
      'Which workers are not CIS verified?',
      'Show me timesheets this week',
      'Show subcontractors'
    ]
  };
}

async function handleRfis() {
  const { rows } = await pool.query(
    `SELECT number, project, subject, priority, status, submitted_date, due_date FROM rfis ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No RFIs found.',
      data: { count: 0 },
      suggestions: ['Show me all projects', 'Show safety incidents', 'Show team members']
    };
  }
  const open      = rows.filter(r => r.status === 'open' || r.status === 'pending');
  const overdue   = rows.filter(r => r.status === 'overdue');
  const high      = rows.filter(r => r.priority === 'high' || r.priority === 'critical');

  let reply = `There are **${rows.length} RFIs** — ${open.length} open, ${overdue.length} overdue, ${high.length} high priority.\n\n`;
  if (high.length) {
    reply += 'High priority RFIs:\n';
    high.slice(0, 5).forEach(r => {
      reply += `• ${r.number} — ${r.project}: ${r.subject} (${r.status})\n`;
    });
  }

  return {
    reply,
    data: { count: rows.length, open: open.length, overdue: overdue.length, highPriority: high.length, rfis: rows },
    suggestions: [
      'Show me all open RFIs',
      'Which projects have the most RFIs?',
      'Show me change orders'
    ]
  };
}

async function handleTenders() {
  const { rows } = await pool.query(
    `SELECT title, client, value, deadline, status, probability, type FROM tenders ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No tenders found.',
      data: { count: 0 },
      suggestions: ['Show me all projects', 'Show invoices', 'Show team members']
    };
  }
  const active    = rows.filter(r => r.status === 'active' || r.status === 'submitted' || r.status === 'in_progress');
  const won       = rows.filter(r => r.status === 'won');
  const totalVal  = rows.reduce((s, r) => s + (parseFloat(r.value) || 0), 0);
  const pipeline  = active.reduce((s, r) => s + (parseFloat(r.value) || 0), 0);

  let reply = `You have **${rows.length} tenders** — ${active.length} active, ${won.length} won.\n`;
  reply += `Total pipeline value: ${fmt(pipeline)} | All-time tender value: ${fmt(totalVal)}.\n\n`;
  if (active.length) {
    reply += 'Active tenders:\n';
    active.slice(0, 5).forEach(t => {
      reply += `• ${t.title} (${t.client}) — ${fmt(t.value)}, deadline ${t.deadline ? new Date(t.deadline).toLocaleDateString('en-GB') : 'TBC'}, probability ${t.probability ?? '?'}%\n`;
    });
  }

  return {
    reply,
    data: { count: rows.length, active: active.length, won: won.length, totalVal, pipeline, tenders: rows },
    suggestions: [
      'Which tenders have the highest probability?',
      'Show me won tenders',
      'Show me all projects'
    ]
  };
}

async function handleMaterials() {
  const { rows } = await pool.query(
    `SELECT name, category, quantity, unit, unit_cost, total_cost, supplier, status, delivery_date FROM materials ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No materials found in the database.',
      data: { count: 0 },
      suggestions: ['Show me purchase orders', 'Show me equipment', 'Show me all projects']
    };
  }
  const totalCost = rows.reduce((s, r) => s + (parseFloat(r.total_cost) || 0), 0);
  const byStatus = {};
  rows.forEach(r => { const st = r.status || 'unknown'; byStatus[st] = (byStatus[st] || 0) + 1; });

  let reply = `There are **${rows.length} material records** with a total cost of ${fmt(totalCost)}.\n\n`;
  reply += 'Breakdown by status:\n';
  Object.entries(byStatus).forEach(([st, n]) => { reply += `• ${st}: ${n}\n`; });
  reply += '\nTop materials:\n';
  rows.slice(0, 8).forEach(m => {
    reply += `• ${m.name} (${m.category || 'N/A'}) — ${m.quantity} ${m.unit || ''}, ${fmt(m.total_cost)}, supplier: ${m.supplier || 'N/A'}, status: ${m.status || 'N/A'}`;
    if (m.delivery_date) reply += `, delivery: ${new Date(m.delivery_date).toLocaleDateString('en-GB')}`;
    reply += '\n';
  });
  if (rows.length > 8) reply += `…and ${rows.length - 8} more.\n`;

  return {
    reply,
    data: { count: rows.length, totalCost, byStatus, materials: rows },
    suggestions: [
      'Show me purchase orders',
      'Show me equipment on site',
      'Show me all projects'
    ]
  };
}

async function handleTimesheets() {
  const { rows } = await pool.query(
    `SELECT worker, project, week, regular_hours, overtime_hours, total_pay, status, cis_deduction FROM timesheets ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No timesheets found.',
      data: { count: 0 },
      suggestions: ['Show me team members', 'Show me CIS returns', 'Show me all projects']
    };
  }
  const totalHours    = rows.reduce((s, r) => s + (parseFloat(r.regular_hours) || 0) + (parseFloat(r.overtime_hours) || 0), 0);
  const totalOT       = rows.reduce((s, r) => s + (parseFloat(r.overtime_hours) || 0), 0);
  const totalPay      = rows.reduce((s, r) => s + (parseFloat(r.total_pay) || 0), 0);
  const totalCIS      = rows.reduce((s, r) => s + (parseFloat(r.cis_deduction) || 0), 0);
  const byStatus = {};
  rows.forEach(r => { const st = r.status || 'unknown'; byStatus[st] = (byStatus[st] || 0) + 1; });

  let reply = `There are **${rows.length} timesheet records**.\n`;
  reply += `Total hours: ${totalHours.toFixed(1)} (overtime: ${totalOT.toFixed(1)}) | Total pay: ${fmt(totalPay)} | CIS deductions: ${fmt(totalCIS)}.\n\n`;
  reply += 'Breakdown by status:\n';
  Object.entries(byStatus).forEach(([st, n]) => { reply += `• ${st}: ${n}\n`; });
  reply += '\nRecent timesheets:\n';
  rows.slice(0, 8).forEach(t => {
    reply += `• ${t.worker} — ${t.project}, week ${t.week || 'N/A'}, ${(parseFloat(t.regular_hours)||0) + (parseFloat(t.overtime_hours)||0)} hrs, pay ${fmt(t.total_pay)}, status: ${t.status || 'N/A'}\n`;
  });
  if (rows.length > 8) reply += `…and ${rows.length - 8} more.\n`;

  return {
    reply,
    data: { count: rows.length, totalHours, totalOvertimeHours: totalOT, totalPay, totalCISDeductions: totalCIS, byStatus, timesheets: rows },
    suggestions: [
      'Show me CIS returns',
      'Show me team members',
      'Show me subcontractors'
    ]
  };
}

async function handleSubcontractors() {
  const { rows } = await pool.query(
    `SELECT company, trade, contact, status, cis_verified, insurance_expiry, rams_approved, current_project, contract_value, rating FROM subcontractors ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No subcontractors found.',
      data: { count: 0 },
      suggestions: ['Show me team members', 'Show me all projects', 'Show me RAMS']
    };
  }
  const active        = rows.filter(r => r.status === 'active');
  const inactive      = rows.filter(r => r.status !== 'active');
  const unverifiedCIS = rows.filter(r => !r.cis_verified || r.cis_verified === false || r.cis_verified === 'false');
  const now           = new Date();
  const in30          = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringIns   = rows.filter(r => {
    if (!r.insurance_expiry) return false;
    const d = new Date(r.insurance_expiry);
    return d >= now && d <= in30;
  });

  let reply = `There are **${rows.length} subcontractors** — ${active.length} active, ${inactive.length} inactive.\n`;
  reply += `CIS unverified: ${unverifiedCIS.length} | Insurance expiring within 30 days: ${expiringIns.length}.\n\n`;
  if (expiringIns.length) {
    reply += 'Expiring insurance:\n';
    expiringIns.forEach(s => {
      reply += `• ${s.company} — expires ${new Date(s.insurance_expiry).toLocaleDateString('en-GB')}\n`;
    });
    reply += '\n';
  }
  reply += 'Top subcontractors:\n';
  rows.slice(0, 6).forEach(s => {
    reply += `• ${s.company} (${s.trade || 'N/A'}) — ${s.status || 'N/A'}, CIS: ${s.cis_verified ? 'verified' : 'UNVERIFIED'}, contract: ${fmt(s.contract_value)}, rating: ${s.rating || 'N/A'}\n`;
  });
  if (rows.length > 6) reply += `…and ${rows.length - 6} more.\n`;

  return {
    reply,
    data: { count: rows.length, active: active.length, inactive: inactive.length, unverifiedCIS: unverifiedCIS.length, expiringInsurance: expiringIns.length, subcontractors: rows },
    suggestions: [
      'Show me RAMS',
      'Show me CIS returns',
      'Show me team members'
    ]
  };
}

async function handleEquipment() {
  const { rows } = await pool.query(
    `SELECT name, type, registration, status, location, next_service, daily_rate FROM equipment ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No equipment records found.',
      data: { count: 0 },
      suggestions: ['Show me materials', 'Show me all projects', 'Show me purchase orders']
    };
  }
  const byStatus = {};
  rows.forEach(r => { const st = r.status || 'unknown'; byStatus[st] = (byStatus[st] || 0) + 1; });
  const now    = new Date();
  const in14   = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const upcoming = rows.filter(r => {
    if (!r.next_service) return false;
    const d = new Date(r.next_service);
    return d >= now && d <= in14;
  });

  let reply = `There are **${rows.length} equipment records**.\n\nBreakdown by status:\n`;
  Object.entries(byStatus).forEach(([st, n]) => { reply += `• ${st}: ${n}\n`; });
  if (upcoming.length) {
    reply += `\nService due within 14 days (${upcoming.length}):\n`;
    upcoming.forEach(e => {
      reply += `• ${e.name} (${e.registration || 'N/A'}) — service ${new Date(e.next_service).toLocaleDateString('en-GB')}\n`;
    });
  }
  reply += '\nEquipment list:\n';
  rows.slice(0, 8).forEach(e => {
    reply += `• ${e.name} (${e.type || 'N/A'}) — ${e.status || 'N/A'}, location: ${e.location || 'N/A'}, rate: ${fmt(e.daily_rate)}/day\n`;
  });
  if (rows.length > 8) reply += `…and ${rows.length - 8} more.\n`;

  return {
    reply,
    data: { count: rows.length, byStatus, upcomingServices: upcoming.length, equipment: rows },
    suggestions: [
      'Show me materials',
      'Show me purchase orders',
      'Show me all projects'
    ]
  };
}

async function handleChangeOrders() {
  const { rows } = await pool.query(
    `SELECT number, project, title, amount, status, submitted_date FROM change_orders ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No change orders found.',
      data: { count: 0 },
      suggestions: ['Show me RFIs', 'Show me all projects', 'Show me purchase orders']
    };
  }
  const totalValue = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const byStatus = {};
  rows.forEach(r => { const st = r.status || 'unknown'; byStatus[st] = (byStatus[st] || 0) + 1; });

  let reply = `There are **${rows.length} change orders** with a total value of ${fmt(totalValue)}.\n\nBreakdown by status:\n`;
  Object.entries(byStatus).forEach(([st, n]) => { reply += `• ${st}: ${n}\n`; });
  reply += '\nChange orders:\n';
  rows.slice(0, 8).forEach(co => {
    reply += `• ${co.number} — ${co.project}: ${co.title}, ${fmt(co.amount)}, status: ${co.status || 'N/A'}`;
    if (co.submitted_date) reply += `, submitted: ${new Date(co.submitted_date).toLocaleDateString('en-GB')}`;
    reply += '\n';
  });
  if (rows.length > 8) reply += `…and ${rows.length - 8} more.\n`;

  return {
    reply,
    data: { count: rows.length, totalValue, byStatus, changeOrders: rows },
    suggestions: [
      'Show me RFIs',
      'Show me purchase orders',
      'Show me all projects'
    ]
  };
}

async function handlePurchaseOrders() {
  const { rows } = await pool.query(
    `SELECT number, supplier, project, amount, status, order_date, delivery_date FROM purchase_orders ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No purchase orders found.',
      data: { count: 0 },
      suggestions: ['Show me materials', 'Show me change orders', 'Show me all projects']
    };
  }
  const totalValue = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const byStatus = {};
  rows.forEach(r => { const st = r.status || 'unknown'; byStatus[st] = (byStatus[st] || 0) + 1; });
  const now      = new Date();
  const overdue  = rows.filter(r => {
    if (!r.delivery_date || r.status === 'delivered') return false;
    return new Date(r.delivery_date) < now;
  });

  let reply = `There are **${rows.length} purchase orders** totalling ${fmt(totalValue)}.\n\nBreakdown by status:\n`;
  Object.entries(byStatus).forEach(([st, n]) => { reply += `• ${st}: ${n}\n`; });
  if (overdue.length) {
    reply += `\nOverdue deliveries (${overdue.length}):\n`;
    overdue.slice(0, 5).forEach(po => {
      reply += `• ${po.number} — ${po.supplier}, ${fmt(po.amount)}, due ${new Date(po.delivery_date).toLocaleDateString('en-GB')}\n`;
    });
  }
  reply += '\nPurchase orders:\n';
  rows.slice(0, 8).forEach(po => {
    reply += `• ${po.number} — ${po.supplier} (${po.project}), ${fmt(po.amount)}, status: ${po.status || 'N/A'}\n`;
  });
  if (rows.length > 8) reply += `…and ${rows.length - 8} more.\n`;

  return {
    reply,
    data: { count: rows.length, totalValue, byStatus, overdueDeliveries: overdue.length, purchaseOrders: rows },
    suggestions: [
      'Show me materials',
      'Show me change orders',
      'Show me invoices'
    ]
  };
}

async function handleContacts() {
  const { rows } = await pool.query(
    `SELECT name, company, role, type, email, phone, status, last_contact FROM contacts ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No contacts found.',
      data: { count: 0 },
      suggestions: ['Show me all projects', 'Show me subcontractors', 'Show me team members']
    };
  }
  const byType = {};
  rows.forEach(r => { const t = r.type || 'unknown'; byType[t] = (byType[t] || 0) + 1; });
  const recentlyCont = rows
    .filter(r => r.last_contact)
    .sort((a, b) => new Date(b.last_contact) - new Date(a.last_contact))
    .slice(0, 3);

  let reply = `There are **${rows.length} contacts** in the CRM.\n\nBreakdown by type:\n`;
  Object.entries(byType).forEach(([t, n]) => { reply += `• ${t}: ${n}\n`; });
  if (recentlyCont.length) {
    reply += '\nRecently contacted:\n';
    recentlyCont.forEach(c => {
      reply += `• ${c.name} (${c.company || 'N/A'}) — ${new Date(c.last_contact).toLocaleDateString('en-GB')}\n`;
    });
  }
  reply += '\nTop contacts:\n';
  rows.slice(0, 8).forEach(c => {
    reply += `• ${c.name} — ${c.company || 'N/A'}, ${c.role || 'N/A'}, type: ${c.type || 'N/A'}, status: ${c.status || 'N/A'}\n`;
  });
  if (rows.length > 8) reply += `…and ${rows.length - 8} more.\n`;

  return {
    reply,
    data: { count: rows.length, byType, contacts: rows },
    suggestions: [
      'Show me subcontractors',
      'Show me all projects',
      'Show me tenders'
    ]
  };
}

async function handleRams() {
  const { rows } = await pool.query(
    `SELECT title, project, activity, version, status, created_by, review_date FROM rams ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No RAMS documents found.',
      data: { count: 0 },
      suggestions: ['Show me safety incidents', 'Show me risk register', 'Show me all projects']
    };
  }
  const byStatus = {};
  rows.forEach(r => { const st = r.status || 'unknown'; byStatus[st] = (byStatus[st] || 0) + 1; });
  const now  = new Date();
  const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const upcoming = rows.filter(r => {
    if (!r.review_date) return false;
    const d = new Date(r.review_date);
    return d >= now && d <= in14;
  });

  let reply = `There are **${rows.length} RAMS documents**.\n\nBreakdown by status:\n`;
  Object.entries(byStatus).forEach(([st, n]) => { reply += `• ${st}: ${n}\n`; });
  if (upcoming.length) {
    reply += `\nReviews due within 14 days (${upcoming.length}):\n`;
    upcoming.forEach(r => {
      reply += `• ${r.title} (${r.project}) — review: ${new Date(r.review_date).toLocaleDateString('en-GB')}\n`;
    });
  }
  reply += '\nRAMS list:\n';
  rows.slice(0, 8).forEach(r => {
    reply += `• ${r.title} — ${r.project}, activity: ${r.activity || 'N/A'}, v${r.version || '1'}, status: ${r.status || 'N/A'}\n`;
  });
  if (rows.length > 8) reply += `…and ${rows.length - 8} more.\n`;

  return {
    reply,
    data: { count: rows.length, byStatus, upcomingReviews: upcoming.length, rams: rows },
    suggestions: [
      'Show me safety incidents',
      'Show me risk register',
      'Show me subcontractors'
    ]
  };
}

async function handleCIS() {
  const { rows } = await pool.query(
    `SELECT contractor, utr, period, gross_payment, labour_net, cis_deduction, status, verification_status FROM cis_returns ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No CIS returns found.',
      data: { count: 0 },
      suggestions: ['Show me timesheets', 'Show me subcontractors', 'Show me team members']
    };
  }
  const totalDeductions = rows.reduce((s, r) => s + (parseFloat(r.cis_deduction) || 0), 0);
  const totalGross      = rows.reduce((s, r) => s + (parseFloat(r.gross_payment) || 0), 0);
  const byStatus = {};
  rows.forEach(r => { const st = r.status || 'unknown'; byStatus[st] = (byStatus[st] || 0) + 1; });
  const byVerification = {};
  rows.forEach(r => { const v = r.verification_status || 'unknown'; byVerification[v] = (byVerification[v] || 0) + 1; });

  let reply = `There are **${rows.length} CIS returns** with total deductions of ${fmt(totalDeductions)} on gross payments of ${fmt(totalGross)}.\n\n`;
  reply += 'Breakdown by status:\n';
  Object.entries(byStatus).forEach(([st, n]) => { reply += `• ${st}: ${n}\n`; });
  reply += '\nVerification status:\n';
  Object.entries(byVerification).forEach(([v, n]) => { reply += `• ${v}: ${n}\n`; });
  reply += '\nCIS returns:\n';
  rows.slice(0, 8).forEach(c => {
    reply += `• ${c.contractor} (UTR: ${c.utr || 'N/A'}) — period: ${c.period || 'N/A'}, gross: ${fmt(c.gross_payment)}, CIS: ${fmt(c.cis_deduction)}, status: ${c.status || 'N/A'}\n`;
  });
  if (rows.length > 8) reply += `…and ${rows.length - 8} more.\n`;

  return {
    reply,
    data: { count: rows.length, totalDeductions, totalGross, byStatus, byVerification, cisReturns: rows },
    suggestions: [
      'Show me timesheets',
      'Show me subcontractors',
      'Show me team members'
    ]
  };
}

async function handleDailyReports() {
  const { rows } = await pool.query(
    `SELECT project, date, prepared_by, weather, workers_on_site, progress FROM daily_reports ORDER BY date DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No daily reports found.',
      data: { count: 0 },
      suggestions: ['Show me all projects', 'Show me safety incidents', 'Show me team members']
    };
  }
  const avgWorkers  = rows.reduce((s, r) => s + (parseFloat(r.workers_on_site) || 0), 0) / rows.length;
  const avgProgress = rows.reduce((s, r) => s + (parseFloat(r.progress) || 0), 0) / rows.length;

  let reply = `There are **${rows.length} daily reports** on record.\n`;
  reply += `Average workers on site: ${avgWorkers.toFixed(1)} | Average progress: ${avgProgress.toFixed(1)}%.\n\n`;
  reply += 'Recent reports:\n';
  rows.slice(0, 8).forEach(d => {
    reply += `• ${d.project} — ${d.date ? new Date(d.date).toLocaleDateString('en-GB') : 'N/A'}, ${d.workers_on_site || 0} workers, ${d.progress || 0}% progress, weather: ${d.weather || 'N/A'}\n`;
  });
  if (rows.length > 8) reply += `…and ${rows.length - 8} more.\n`;

  return {
    reply,
    data: { count: rows.length, avgWorkersOnSite: parseFloat(avgWorkers.toFixed(1)), avgProgress: parseFloat(avgProgress.toFixed(1)), reports: rows },
    suggestions: [
      'Show me all projects',
      'Show me safety incidents',
      'Show me team members'
    ]
  };
}

async function handleRisk() {
  const { rows } = await pool.query(
    `SELECT title, project, category, likelihood, impact, risk_score, owner, status FROM risk_register ORDER BY risk_score DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No risk register entries found.',
      data: { count: 0 },
      suggestions: ['Show me safety incidents', 'Show me RAMS', 'Show me all projects']
    };
  }
  const byStatus  = {};
  rows.forEach(r => { const st = r.status || 'unknown'; byStatus[st] = (byStatus[st] || 0) + 1; });
  const highRisk  = rows.filter(r => (parseFloat(r.risk_score) || 0) >= 15);

  let reply = `There are **${rows.length} risks** in the risk register.\n\nBreakdown by status:\n`;
  Object.entries(byStatus).forEach(([st, n]) => { reply += `• ${st}: ${n}\n`; });
  if (highRisk.length) {
    reply += `\nHigh risk items (score >= 15) — ${highRisk.length} total:\n`;
    highRisk.slice(0, 6).forEach(r => {
      reply += `• [Score: ${r.risk_score}] ${r.title} — ${r.project}, ${r.category || 'N/A'}, owner: ${r.owner || 'N/A'}, status: ${r.status || 'N/A'}\n`;
    });
  }
  reply += '\nFull risk list (by score):\n';
  rows.slice(0, 8).forEach(r => {
    reply += `• [${r.risk_score}] ${r.title} — ${r.project}, likelihood: ${r.likelihood || 'N/A'}, impact: ${r.impact || 'N/A'}\n`;
  });
  if (rows.length > 8) reply += `…and ${rows.length - 8} more.\n`;

  return {
    reply,
    data: { count: rows.length, byStatus, highRiskCount: highRisk.length, risks: rows },
    suggestions: [
      'Show me safety incidents',
      'Show me RAMS',
      'Show me all projects'
    ]
  };
}



async function handleValuations() {
  const { rows } = await pool.query(
    `SELECT reference, project, contractor_name, client_name, application_number,
            period_start, period_end, status, original_value, variations,
            total_value, retention, amount_due, submitted_date, certified_date
     FROM valuations ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No valuations found.',
      data: { count: 0 },
      suggestions: ['Show me all projects', 'Show invoices', 'Show change orders']
    };
  }
  const draft     = rows.filter(r => r.status === 'draft');
  const submitted = rows.filter(r => r.status === 'submitted');
  const certified = rows.filter(r => r.status === 'certified');
  const paid      = rows.filter(r => r.status === 'paid');
  const totalAmt  = rows.reduce((s, r) => s + parseFloat(r.amount_due || 0), 0);
  const totalOrig = rows.reduce((s, r) => s + parseFloat(r.original_value || 0), 0);

  let reply = `You have **${rows.length} valuations** — ${draft.length} draft, ${submitted.length} submitted, ${certified.length} certified, ${paid.length} paid.\n`;
  reply += `Total gross value: ${fmt(totalOrig)} | Total amount due: ${fmt(totalAmt)}.\n\n`;
  if (submitted.length) {
    reply += 'Awaiting certification:\n';
    submitted.slice(0, 5).forEach(v => {
      reply += `• ${v.reference || 'Valuation #' + v.application_number} — ${v.project} (${v.contractor_name}) — ${fmt(v.amount_due)}, submitted ${v.submitted_date ? new Date(v.submitted_date).toLocaleDateString('en-GB') : 'N/A'}\n`;
    });
  }
  if (certified.length) {
    reply += 'Certified (awaiting payment):\n';
    certified.slice(0, 5).forEach(v => {
      reply += `• ${v.reference || 'Valuation #' + v.application_number} — ${v.project} — ${fmt(v.amount_due)} certified ${v.certified_date ? new Date(v.certified_date).toLocaleDateString('en-GB') : 'N/A'}\n`;
    });
  }

  return {
    reply,
    data: { count: rows.length, draft: draft.length, submitted: submitted.length, certified: certified.length, paid: paid.length, totalAmountDue: totalAmt, valuations: rows },
    suggestions: [
      'Which valuations are overdue for certification?',
      'Show me defects by project',
      'Show me all projects'
    ]
  };
}


async function handleDefects() {
  const { rows } = await pool.query(
    `SELECT reference, title, project, location, priority, status, trade,
            raised_by, assigned_to, due_date, cost, category, description
     FROM defects ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No defects or snags recorded.',
      data: { count: 0 },
      suggestions: ['Show me all projects', 'Show open RFIs', 'Show safety incidents']
    };
  }
  const open     = rows.filter(r => r.status === 'open' || r.status === 'in_progress');
  const resolved = rows.filter(r => r.status === 'resolved' || r.status === 'closed');
  const highPri  = rows.filter(r => r.priority === 'high' || r.priority === 'critical');
  const overdue   = rows.filter(r => r.due_date && new Date(r.due_date) < new Date() && r.status !== 'resolved' && r.status !== 'closed');
  const totalCost = rows.reduce((s, r) => s + parseFloat(r.cost || 0), 0);

  let reply = `You have **${rows.length} defects/snags** — ${open.length} open, ${resolved.length} resolved.\n`;
  reply += `High/critical priority: ${highPri.length} | Overdue: ${overdue.length} | Total estimated cost: ${fmt(totalCost)}.\n\n`;
  if (open.length) {
    reply += 'Open defects:\n';
    open.slice(0, 6).forEach(d => {
      reply += `• [${(d.priority || 'medium').toUpperCase()}] ${d.title} — ${d.project} @ ${d.location || 'N/A'}, due ${d.due_date ? new Date(d.due_date).toLocaleDateString('en-GB') : 'N/A'}\n`;
    });
  }

  return {
    reply,
    data: { count: rows.length, open: open.length, resolved: resolved.length, highPriority: highPri.length, overdue: overdue.length, totalCost, defects: rows },
    suggestions: [
      'Show me overdue defects',
      'Show defects by project',
      'Show me valuations'
    ]
  };
}
async function handleBudget() {
  const { rows } = await pool.query(
    `SELECT name, client, budget, spent, status FROM projects ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No project budget data found.',
      data: {},
      suggestions: ['Show me all projects', 'Show me invoices', 'Show me tenders']
    };
  }
  const totalBudget = rows.reduce((s, r) => s + (parseFloat(r.budget) || 0), 0);
  const totalSpent  = rows.reduce((s, r) => s + (parseFloat(r.spent)  || 0), 0);
  const remaining   = totalBudget - totalSpent;
  const overBudget  = rows.filter(r => parseFloat(r.spent) > parseFloat(r.budget));

  let reply = `**Budget Overview across ${rows.length} projects:**\n`;
  reply += `• Total budget: ${fmt(totalBudget)}\n`;
  reply += `• Total spent: ${fmt(totalSpent)} (${pct(totalSpent, totalBudget)}%)\n`;
  reply += `• Remaining: ${fmt(remaining)}\n`;
  if (overBudget.length) {
    reply += `\n⚠️ ${overBudget.length} project(s) are over budget:\n`;
    overBudget.forEach(p => {
      reply += `• ${p.name} (${p.client}) — budget ${fmt(p.budget)}, spent ${fmt(p.spent)}, overspend ${fmt(parseFloat(p.spent) - parseFloat(p.budget))}\n`;
    });
  } else {
    reply += '\nAll projects are within budget.';
  }

  return {
    reply,
    data: { totalBudget, totalSpent, remaining, overBudgetCount: overBudget.length, projects: rows },
    suggestions: [
      'Show me overdue invoices',
      'What is our cash position?',
      'Show me all projects'
    ]
  };
}

// ─── Report generation ────────────────────────────────────────────────────────

async function handleGenerateReport(message) {
  const m = message.toLowerCase();
  let reportType = 'daily';
  if (/safety|incident|hazard/.test(m)) reportType = 'safety';
  else if (/financial|finance|invoice|payment|cost|budget/.test(m)) reportType = 'financial';
  else if (/executive|summary|overview|portfolio|board/.test(m)) reportType = 'executive';

  const now = new Date();
  let title = `CortexBuild ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report — ${now.toLocaleDateString('en-GB')}`;

  const htmlSections = [];
  const sections = [];

  if (reportType === 'daily' || reportType === 'executive') {
    const { rows: projects } = await pool.query(
      `SELECT name, client, status, progress, budget, spent, manager, location
       FROM projects ORDER BY created_at DESC LIMIT 20`
    );
    const { rows: dailyReports } = await pool.query(
      `SELECT project, date, prepared_by, weather, workers_on_site, progress
       FROM daily_reports ORDER BY date DESC LIMIT 14`
    );
    const active = projects.filter(r => r.status === 'active' || r.status === 'in_progress');
    const totalBudget = projects.reduce((s, r) => s + parseFloat(r.budget || 0), 0);
    const totalSpent  = projects.reduce((s, r) => s + parseFloat(r.spent  || 0), 0);

    htmlSections.push(`<h2>📋 Projects Overview</h2>
<p><strong>Total Projects:</strong> ${projects.length} | <strong>Active:</strong> ${active.length} | <strong>Budget:</strong> ${fmt(totalBudget)} | <strong>Spent:</strong> ${fmt(totalSpent)} (${pct(totalSpent, totalBudget)}%)</p>
<table><thead><tr><th>Project</th><th>Client</th><th>Status</th><th>Progress</th><th>Budget</th><th>Spent</th></tr></thead><tbody>
${projects.slice(0, 10).map(p => `<tr><td>${p.name}</td><td>${p.client || 'N/A'}</td><td>${p.status}</td><td>${p.progress ?? 0}%</td><td>${fmt(p.budget)}</td><td>${fmt(p.spent)}</td></tr>`).join('')}
</tbody></table>`);

    sections.push({
      title: 'Projects Overview',
      count: projects.length,
      active,
      totalBudget,
      totalSpent,
      pct: pct(totalSpent, totalBudget),
      projects: projects.slice(0, 10)
    });
  }

  if (reportType === 'safety' || reportType === 'executive') {
    const { rows: incidents } = await pool.query(
      `SELECT type, title, severity, status, project, date FROM safety_incidents ORDER BY created_at DESC`
    );
    const open = incidents.filter(r => r.status === 'open' || r.status === 'investigating');
    const high = incidents.filter(r => r.severity === 'high' || r.severity === 'critical');

    htmlSections.push(`<h2>🛡️ Safety Incidents</h2>
<p><strong>Total:</strong> ${incidents.length} | <strong>Open:</strong> ${open.length} | <strong>High/Critical:</strong> ${high.length}</p>
${open.length ? `<table><thead><tr><th>Title</th><th>Project</th><th>Severity</th><th>Status</th><th>Date</th></tr></thead><tbody>
${open.slice(0, 8).map(i => `<tr><td>${i.title}</td><td>${i.project}</td><td>${i.severity}</td><td>${i.status}</td><td>${i.date ? new Date(i.date).toLocaleDateString('en-GB') : 'N/A'}</td></tr>`).join('')}
</tbody></table>` : '<p>No open incidents — great news!</p>'}`);

    sections.push({
      title: 'Safety',
      count: incidents.length,
      open: open.length,
      highSeverity: high.length,
      incidents: open.slice(0, 8)
    });
  }

  if (reportType === 'financial' || reportType === 'executive') {
    const { rows: invoices } = await pool.query(
      `SELECT number, client, project, amount, status, due_date FROM invoices ORDER BY created_at DESC`
    );
    const overdue = invoices.filter(r => r.status === 'overdue');
    const paid    = invoices.filter(r => r.status === 'paid');
    const pending = invoices.filter(r => r.status === 'pending' || r.status === 'sent');
    const totalAmt = invoices.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const overdueAmt = overdue.reduce((s, r) => s + parseFloat(r.amount || 0), 0);

    htmlSections.push(`<h2>💰 Financial Summary</h2>
<p><strong>Total Invoiced:</strong> ${fmt(totalAmt)} | <strong>Paid:</strong> ${paid.length} | <strong>Pending:</strong> ${pending.length} | <strong>Overdue:</strong> ${overdue.length} (${fmt(overdueAmt)})</p>
${overdue.length ? `<table><thead><tr><th>Invoice</th><th>Client</th><th>Project</th><th>Amount</th><th>Due Date</th></tr></thead><tbody>
${overdue.slice(0, 8).map(i => `<tr><td>${i.number}</td><td>${i.client}</td><td>${i.project}</td><td>${fmt(i.amount)}</td><td>${i.due_date ? new Date(i.due_date).toLocaleDateString('en-GB') : 'N/A'}</td></tr>`).join('')}
</tbody></table>` : '<p>No overdue invoices!</p>'}`);

    sections.push({
      title: 'Financial',
      totalInvoiced: totalAmt,
      overdueCount: overdue.length,
      overdueAmount: overdueAmt,
      paidCount: paid.length,
      pendingCount: pending.length,
      invoices: overdue.slice(0, 8)
    });
  }

  if (reportType === 'daily') {
    const { rows: dailyReports } = await pool.query(
      `SELECT project, date, prepared_by, weather, workers_on_site, progress
       FROM daily_reports ORDER BY date DESC LIMIT 7`
    );
    const avgWorkers = dailyReports.length
      ? (dailyReports.reduce((s, r) => s + parseFloat(r.workers_on_site || 0), 0) / dailyReports.length).toFixed(1)
      : 0;

    htmlSections.push(`<h2>📅 Daily Reports (Last 7 Days)</h2>
<p><strong>Average Workers on Site:</strong> ${avgWorkers}</p>
<table><thead><tr><th>Project</th><th>Date</th><th>Weather</th><th>Workers</th><th>Progress</th><th>Prepared By</th></tr></thead><tbody>
${dailyReports.map(d => `<tr><td>${d.project}</td><td>${d.date ? new Date(d.date).toLocaleDateString('en-GB') : 'N/A'}</td><td>${d.weather || 'N/A'}</td><td>${d.workers_on_site || 0}</td><td>${d.progress || 0}%</td><td>${d.prepared_by}</td></tr>`).join('')}
</tbody></table>`);
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #222; }
  h1 { color: #1a3a6b; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
  h2 { color: #1e40af; margin-top: 30px; border-left: 4px solid #3b82f6; padding-left: 10px; }
  table { border-collapse: collapse; width: 100%; margin-top: 10px; }
  th { background: #1e3a6b; color: white; padding: 8px 12px; text-align: left; }
  td { padding: 7px 12px; border-bottom: 1px solid #e5e7eb; }
  tr:hover { background: #f9fafb; }
  p { margin: 8px 0; }
  .footer { margin-top: 40px; font-size: 11px; color: #888; border-top: 1px solid #e5e7eb; padding-top: 10px; }
</style></head>
<body>
<h1>${title}</h1>
<p><strong>Generated:</strong> ${now.toLocaleString('en-GB')} | <strong>Report Type:</strong> ${reportType.toUpperCase()}</p>
${htmlSections.join('\n')}
<div class="footer">CortexBuild Ultimate — Construction Management Platform — Confidential</div>
</body></html>`;

  // Strip HTML for plain-text reply
  const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  let reply = `📊 I've generated a **${reportType} report** for you. `;
  if (sections.find(s => s.title === 'Projects Overview')) {
    const p = sections.find(s => s.title === 'Projects Overview');
    reply += `${p.count} projects, ${p.active?.length ?? 0} active, budget ${fmt(p.totalBudget)}, ${p.pct}% spent.\n`;
  }
  if (sections.find(s => s.title === 'Safety')) {
    const s = sections.find(s => s.title === 'Safety');
    reply += `${s.count} safety incidents, ${s.open} open, ${s.highSeverity} high/critical.\n`;
  }
  if (sections.find(s => s.title === 'Financial')) {
    const f = sections.find(s => s.title === 'Financial');
    reply += `${f.totalInvoiced ? `Financial: ${fmt(f.totalInvoiced)} invoiced, ${f.overdueCount} overdue (${fmt(f.overdueAmount)}).\n` : ''}`;
  }
  reply += `\n*Print this page to PDF (Ctrl+P / Cmd+P) or the report HTML will open in your browser.*`;

  return {
    reply,
    data: {
      reportType,
      title,
      generatedAt: now.toISOString(),
      sections,
      html
    },
    suggestions: [
      'Show me overdue invoices',
      'Show me safety incidents',
      'Show me all projects'
    ]
  };
}

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

// ─── Intent classifier ────────────────────────────────────────────────────────

function classify(message) {
  const m = message.toLowerCase();
  if (/overdue/.test(m))                                                                        return 'overdue';
  if (/budget/.test(m))                                                                         return 'budget';
  if (/\brams\b|\bram\b|method statement|risk assessment/.test(m))                             return 'rams';
  if (/\bcis\b|cis return|cis returns|construction industry scheme|deduction/.test(m))         return 'cis';
  if (/daily report|daily reports|site diary|progress report/.test(m))                         return 'daily_reports';
  if (/risk register|hazard register|\brisk\b|\brisks\b/.test(m))                              return 'risk';
  if (/change order|change orders|variation|variations|\bco\b|\bvo\b/.test(m))                 return 'change_orders';
  if (/purchase order|purchase orders|\bprocurement\b|supplier order/.test(m))                 return 'purchase_orders';
  if (/\bpo\b/.test(m))                                                                         return 'purchase_orders';
  if (/subcontractor|subcontractors|subbies|\bcontractor\b|sub-contractor/.test(m))            return 'subcontractors';
  if (/\bequipment\b|\bplant\b|machinery|\bcrane\b|excavator|\bvehicle\b|\bhire\b/.test(m))    return 'equipment';
  if (/\bmaterial\b|\bmaterials\b|\bsupplies\b|\bdelivery\b|\bstock\b/.test(m))                return 'materials';
  if (/timesheet|timesheets|\bhours\b|\bpayroll\b|overtime/.test(m))                           return 'timesheets';
  if (/\bcontact\b|\bcontacts\b|\bclient\b|\bclients\b|\bcrm\b|prospect/.test(m))              return 'contacts';
  if (/project/.test(m))                                                                        return 'projects';
  if (/invoice|invoices|payment|payments|cash/.test(m))                                        return 'invoices';
  if (/safety|incident|hazard|near.?miss|accident/.test(m))                                    return 'safety';
  if (/team|worker|staff|member|employee/.test(m))                                             return 'team';
  if (/\brfi\b|rfis/.test(m))                                                                   return 'rfis';
  if (/tender|bid|bidding|pipeline/.test(m))                                                   return 'tenders';
  if (/valuation|valuations|payment application|interim certificate|prime cost|PC sums/.test(m)) return 'valuations';
  if (/defect|defects|snag|snags|punch list|punchlist|items? list|closing/.test(m))             return 'defects';
  return 'unknown';
}

async function getOllamaResponse(userMessage, context = '') {
  return new Promise((resolve, reject) => {
    const prompt = `You are a helpful AI assistant for CortexBuild, a UK construction management platform. You help users manage projects, contracts, safety, finances, and team operations.

Current user message: ${userMessage}

${context ? `Context from database:\n${context}` : ''}

Provide a helpful, concise response. Format your answer clearly with bullet points and headings where appropriate.`;

    const body = JSON.stringify({
      model: LLM_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 1024,
      }
    });

    const url = new URL(OLLAMA_HOST + '/api/chat');
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const req = lib.request({
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 11434),
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 45000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.message && parsed.message.content) {
            resolve(parsed.message.content);
          } else if (parsed.error) {
            reject(new Error(parsed.error));
          } else {
            resolve(data.substring(0, 500));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Ollama request timed out'));
    });

    req.write(body);
    req.end();
  });
}

// ─── POST /chat ───────────────────────────────────────────────────────────────

router.post('/chat', async (req, res) => {
  const { message, context } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: 'message is required' });
  }

  try {
    const intent = classify(message.trim());
    let result;

    switch (intent) {
      case 'projects':        result = await handleProjects();        break;
      case 'invoices':        result = await handleInvoices();        break;
      case 'overdue':         result = await handleOverdue();         break;
      case 'safety':          result = await handleSafety();          break;
      case 'team':            result = await handleTeam();            break;
      case 'rfis':            result = await handleRfis();            break;
      case 'tenders':         result = await handleTenders();         break;
      case 'budget':          result = await handleBudget();          break;
      case 'valuations':     result = await handleValuations();       break;
      case 'defects':        result = await handleDefects();          break;
      case 'materials':       result = await handleMaterials();       break;
      case 'timesheets':      result = await handleTimesheets();      break;
      case 'subcontractors':  result = await handleSubcontractors();  break;
      case 'equipment':       result = await handleEquipment();       break;
      case 'change_orders':   result = await handleChangeOrders();    break;
      case 'purchase_orders': result = await handlePurchaseOrders();  break;
      case 'contacts':        result = await handleContacts();        break;
      case 'rams':            result = await handleRams();            break;
      case 'cis':             result = await handleCIS();             break;
      case 'daily_reports':   result = await handleDailyReports();    break;
      case 'risk':            result = await handleRisk();            break;
      default:
        result = handleUnknown(message.trim());
        break;
    }

    let reply = result.reply;
    let useLLM = false;

    if (intent === 'unknown' || message.trim().length > 30) {
      try {
        reply = await getOllamaResponse(message.trim(), result.reply);
        useLLM = true;
      } catch (llmErr) {
        console.warn('[AI] Ollama unavailable, using rule-based fallback:', llmErr.message);
      }
    }

    res.json({
      reply,
      data: result.data ?? null,
      suggestions: result.suggestions,
      source: useLLM ? 'ollama' : 'rule-based',
    });
  } catch (err) {
    console.error('[AI /chat]', err.message);
    res.status(500).json({ message: 'AI assistant encountered an error: ' + err.message });
  }
});

module.exports = router;
