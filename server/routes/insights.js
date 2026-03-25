const express = require('express');
const pool = require('../db');

const router = express.Router();

/**
 * GET /api/insights
 * Returns rule-based insights derived from real project data.
 * Multi-tenant: filters by organization_id from req.auth.
 */
router.get('/', async (req, res) => {
  try {
    const auth = req.auth || {};
    const orgId = auth.organization_id;
    const isSuper = ['super_admin', 'company_owner'].includes(auth.role);

    let orgFilter = '';
    let params = [];
    if (orgId && !isSuper) {
      orgFilter = 'WHERE organization_id = $1';
      params.push(orgId);
    }

    const insights = [];

    // ── 1. Financial Insights ────────────────────────────────────────────────
    await generateFinancialInsights(orgFilter, params, insights);

    // ── 2. Safety Insights ───────────────────────────────────────────────────
    await generateSafetyInsights(orgFilter, params, auth, insights);

    // ── 3. Programme Insights ────────────────────────────────────────────────
    await generateProgrammeInsights(orgFilter, params, insights);

    // ── 4. Resource Insights ────────────────────────────────────────────────
    await generateResourceInsights(orgFilter, params, insights);

    res.json(insights);
  } catch (err) {
    console.error('insights error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Financial insights: analyse overdue invoices.
 */
async function generateFinancialInsights(orgFilter, params, insights) {
  const whereClause = orgFilter ? `${orgFilter} AND` : 'WHERE';
  const p = orgFilter ? [...params] : [];

  const overdueResult = await pool.query(`
    SELECT
      COUNT(*) AS overdue_count,
      COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE AND status NOT IN ('paid', 'cancelled')
        THEN amount ELSE 0 END), 0) AS overdue_amount,
      COALESCE(SUM(CASE WHEN status NOT IN ('paid', 'cancelled') THEN amount ELSE 0 END), 0) AS total_outstanding,
      COUNT(CASE WHEN due_date < CURRENT_DATE AND status NOT IN ('paid', 'cancelled') THEN 1 END) AS overdue_invoice_count
    FROM invoices
    ${whereClause} status NOT IN ('paid', 'cancelled')
  `, p);

  const row = overdueResult.rows[0];
  const overdueCount = parseInt(row?.overdue_count ?? 0, 10);
  const overdueAmount = parseFloat(row?.overdue_amount ?? 0);
  const totalOutstanding = parseFloat(row?.total_outstanding ?? 0);
  const overdueInvoiceCount = parseInt(row?.overdue_invoice_count ?? 0, 10);

  if (overdueInvoiceCount > 0) {
    // Severity based on proportion of overdue vs outstanding
    const overdueRatio = totalOutstanding > 0 ? overdueAmount / totalOutstanding : 0;
    let severity = 'medium';
    if (overdueRatio > 0.5 || overdueAmount > 50000) severity = 'high';
    else if (overdueRatio < 0.2 && overdueAmount < 5000) severity = 'low';

    insights.push({
      id: 'fin-001',
      category: 'financial',
      severity,
      title: 'Invoice Payment Delays Accelerating',
      description: `${overdueInvoiceCount} invoice(s) overdue totalling £${overdueAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}. Average payment cycle has extended beyond standard terms.`,
      recommendation: 'Prioritise follow-up with clients representing the largest overdue amounts. Consider implementing automated payment reminders at 7, 14, and 30 days past due.',
      impact: `Working capital constraint of £${overdueAmount.toLocaleString('en-GB', { minimumFractionDigits: 0 })} affecting supplier payments and material procurement.`,
      confidence: Math.min(95, 60 + overdueInvoiceCount * 3),
      dataPoints: overdueInvoiceCount,
      generatedAt: new Date().toISOString(),
    });
  }

  // Payment trend: invoices due in last 60 days vs prior 60 days
  const trendResult = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN due_date >= CURRENT_DATE - INTERVAL '60 days' AND due_date < CURRENT_DATE - INTERVAL '30 days'
        AND status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_previous,
      COALESCE(SUM(CASE WHEN due_date >= CURRENT_DATE - INTERVAL '30 days'
        AND status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_recent
    FROM invoices
    ${whereClause} due_date >= CURRENT_DATE - INTERVAL '60 days'
  `, p);

  const trend = trendResult.rows[0];
  const paidPrevious = parseInt(trend?.paid_previous ?? 0, 10);
  const paidRecent = parseInt(trend?.paid_recent ?? 0, 10);

  if (paidPrevious > 0 && paidRecent < paidPrevious * 0.8) {
    insights.push({
      id: 'fin-002',
      category: 'financial',
      severity: 'medium',
      title: 'Payment Collection Rate Declining',
      description: `Paid invoices in the last 30 days (${paidRecent}) are notably lower than the prior 30-day period (${paidPrevious}). This suggests a slowdown in cash collection.`,
      recommendation: 'Review aged debtor report. Escalate discussions with clients on outstanding retentions. Consider temporary payment plan options to improve cash flow.',
      impact: 'Reduced cash flow may delay material orders and subcontractor payments, increasing project risk.',
      confidence: 72,
      dataPoints: paidPrevious + paidRecent,
      generatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Safety insights: compare incident counts in last 30 days vs previous 30 days.
 */
async function generateSafetyInsights(orgFilter, params, auth, insights) {
  const whereClause = orgFilter ? `${orgFilter} AND` : 'WHERE';
  const p = orgFilter ? [...params] : [];

  const incidentResult = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN reported_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END), 0) AS recent,
      COALESCE(SUM(CASE WHEN reported_at >= CURRENT_DATE - INTERVAL '60 days' AND reported_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END), 0) AS previous
    FROM safety_incidents
    ${whereClause} reported_at >= CURRENT_DATE - INTERVAL '60 days'
  `, p);

  const row = incidentResult.rows[0];
  const recentCount = parseInt(row?.recent ?? 0, 10);
  const previousCount = parseInt(row?.previous ?? 0, 10);

  if (recentCount > previousCount) {
    const increase = previousCount > 0
      ? Math.round(((recentCount - previousCount) / previousCount) * 100)
      : 100;

    let severity = 'medium';
    if (recentCount >= 5 || increase >= 50) severity = 'high';
    if (recentCount >= 10 || increase >= 100) severity = 'critical';

    insights.push({
      id: 'saf-001',
      category: 'safety',
      severity,
      title: 'Safety Incident Rate Changing',
      description: `${recentCount} incident(s) reported in the last 30 days versus ${previousCount} in the prior 30-day period — a ${increase}% increase. This trend warrants immediate attention.`,
      recommendation: 'Conduct a safety stand-down meeting. Review recent incident reports for common root causes. Increase toolbox talk frequency and inspect PPE compliance on site.',
      impact: 'Elevated HSE enforcement risk. Potential site suspension. Increased insurance premiums. Worker morale impact.',
      confidence: Math.min(95, 55 + recentCount * 4),
      dataPoints: recentCount + previousCount,
      generatedAt: new Date().toISOString(),
    });
  }

  // Check for unclosed incidents older than 7 days
  const unclosedResult = await pool.query(`
    SELECT COUNT(*) AS count
    FROM safety_incidents
    ${whereClause} status != 'closed'
      AND reported_at < CURRENT_DATE - INTERVAL '7 days'
  `, p);

  const unclosedCount = parseInt(unclosedResult.rows[0]?.count ?? 0, 10);
  if (unclosedCount > 0) {
    insights.push({
      id: 'saf-002',
      category: 'safety',
      severity: unclosedCount > 3 ? 'high' : 'medium',
      title: 'Unresolved Safety Incidents',
      description: `${unclosedCount} safety incident(s) remain open and are more than 7 days old. Open incidents represent unresolved risk on site.`,
      recommendation: 'Review each open incident and assign corrective actions. Close or escalate any incident that cannot be resolved within 14 days.',
      impact: 'Unresolved incidents may constitute non-compliance with HSE reporting requirements. Fines and reputational damage possible.',
      confidence: 88,
      dataPoints: unclosedCount,
      generatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Programme insights: analyse open old RFIs.
 */
async function generateProgrammeInsights(orgFilter, params, insights) {
  const whereClause = orgFilter ? `${orgFilter} AND` : 'WHERE';
  const p = orgFilter ? [...params] : [];

  // RFIs open more than 30 days
  const openRfiResult = await pool.query(`
    SELECT COUNT(*) AS count
    FROM rfis
    ${whereClause} status NOT IN ('closed', 'answered')
      AND created_at < CURRENT_DATE - INTERVAL '30 days'
  `, p);

  const openRfiCount = parseInt(openRfiResult.rows[0]?.count ?? 0, 10);

  if (openRfiCount > 0) {
    let severity = 'low';
    if (openRfiCount > 10) severity = 'high';
    else if (openRfiCount > 5) severity = 'medium';

    insights.push({
      id: 'prg-001',
      category: 'programme',
      severity,
      title: 'Open RFIs Need Attention',
      description: `${openRfiCount} RFI(s) have been open for more than 30 days without being answered or closed. Outstanding RFIs can block downstream works and delay decisions.`,
      recommendation: 'Review each open RFI with the relevant design team. Escalate any RFI older than 45 days to the project manager for urgent resolution.',
      impact: `Programme delay risk: each unresolved RFI potentially blocks ${openRfiCount} day(s) of work. Coordination failures may result in rework.`,
      confidence: Math.min(92, 60 + openRfiCount * 2),
      dataPoints: openRfiCount,
      generatedAt: new Date().toISOString(),
    });
  }

  // All open RFIs (any age) — high volume is itself a concern
  const totalOpenResult = await pool.query(`
    SELECT COUNT(*) AS count
    FROM rfis
    ${whereClause} status NOT IN ('closed', 'answered')
  `, p);

  const totalOpenCount = parseInt(totalOpenResult.rows[0]?.count ?? 0, 10);
  if (totalOpenCount > 15) {
    insights.push({
      id: 'prg-002',
      category: 'programme',
      severity: 'medium',
      title: 'High RFI Volume Requiring Coordination',
      description: `${totalOpenCount} RFIs are currently open across all projects. A high open RFI volume indicates significant outstanding information requests that need coordinated follow-up.`,
      recommendation: 'Prioritise the most critical RFIs blocking key activities. Schedule a weekly RFI review meeting with the design team to drive closure.',
      impact: 'Coordination overhead and decision bottlenecks. Risk of missed information impacting multiple work fronts.',
      confidence: 78,
      dataPoints: totalOpenCount,
      generatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Resource insights: analyse expiring team certifications.
 */
async function generateResourceInsights(orgFilter, params, insights) {
  // Certifications expiring in next 60 days
  const whereClause = orgFilter ? `${orgFilter} AND` : 'WHERE';
  const p = orgFilter ? [...params] : [];

  const certResult = await pool.query(`
    SELECT COUNT(*) AS count
    FROM certifications
    ${whereClause} expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
  `, p);

  const expiringCertCount = parseInt(certResult.rows[0]?.count ?? 0, 10);

  if (expiringCertCount > 0) {
    let severity = 'low';
    if (expiringCertCount > 3) severity = 'high';
    else if (expiringCertCount > 1) severity = 'medium';

    insights.push({
      id: 'res-001',
      category: 'resource',
      severity,
      title: 'Team Certifications Expiring',
      description: `${expiringCertCount} certification(s) are due to expire within the next 60 days. Expired certifications may restrict site access and create compliance gaps.`,
      recommendation: 'Identify affected team members and schedule renewal training immediately. Consider temporary role reassignments for any certifications that lapse.',
      impact: 'Site access restrictions. Potential HSE compliance breach. Subcontractor approval implications.',
      confidence: 90,
      dataPoints: expiringCertCount,
      generatedAt: new Date().toISOString(),
    });
  }

  // Also check training records for expired/expiring items
  const trainingResult = await pool.query(`
    SELECT COUNT(*) AS count
    FROM training
    ${whereClause} (expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days')
       OR (expiry_date < CURRENT_DATE AND status != 'completed')
  `, p);

  const trainingIssues = parseInt(trainingResult.rows[0]?.count ?? 0, 10);
  if (trainingIssues > 0) {
    insights.push({
      id: 'res-002',
      category: 'resource',
      severity: trainingIssues > 5 ? 'high' : 'medium',
      title: 'Training Records Need Review',
      description: `${trainingIssues} training record(s) are either expired or expiring soon. Out-of-date training can invalidate competency records and create liability.`,
      recommendation: 'Audit all training records. Contact training providers to confirm renewal schedules. Update competency matrices for affected team members.',
      impact: 'Competency gaps on site. Potential non-compliance with client and regulatory training requirements.',
      confidence: 85,
      dataPoints: trainingIssues,
      generatedAt: new Date().toISOString(),
    });
  }
}

module.exports = router;
