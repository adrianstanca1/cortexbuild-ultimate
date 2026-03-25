const express = require('express');
const pool = require('../db');

const router = express.Router();

// Multi-tenancy: extract org/company context from auth
function getTenantFilter(req) {
  const auth = req.user || {};
  if (!auth.role) return { filter: '', params: [] };
  // Super admins see all data
  if (['super_admin', 'company_owner'].includes(auth.role)) {
    return { filter: '', params: [] };
  }
  // Others see only their org
  if (auth.organization_id) {
    return { filter: 'WHERE organization_id = $1', params: [auth.organization_id] };
  }
  return { filter: '', params: [] };
}

// RAG status: hardcoded green for now (would need baseline/budget tracking)
function getRagStatus() {
  return {
    programme: 'green',
    cost: 'green',
    quality: 'green',
    safety: 'green',
  };
}

/**
 * GET /executive/summary
 * Returns KPIs, active projects, and trends for executive dashboard
 */
router.get('/summary', async (req, res) => {
  try {
    const { filter: tenantFilter, params: tenantParams } = getTenantFilter(req);

    // Parallel queries for KPIs and projects
    const [invoicesResult, projectsResult, teamResult] = await Promise.all([
      // Invoice stats for portfolio value and YTD revenue
      pool.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as portfolio_value,
          COALESCE(SUM(CASE WHEN status = 'paid' AND EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE) THEN amount ELSE 0 END), 0) as revenue_ytd
        FROM invoices
        ${tenantFilter}
      `, tenantParams),
      // Active projects count
      pool.query(`
        SELECT COUNT(*) as count FROM projects ${tenantFilter.replace('WHERE', 'WHERE status = \'active\' AND') || 'WHERE status = \'active\''}
      `, tenantParams),
      // Projects list with company info
      pool.query(`
        SELECT 
          p.id,
          p.name,
          p.client,
          p.contract_value as value,
          p.phase,
          p.progress as completion,
          p.manager as pm,
          p.status
        FROM projects p
        ${tenantFilter ? tenantFilter.replace('WHERE', 'WHERE') : ''}
        ${tenantFilter ? 'AND' : 'WHERE'} p.status = 'active'
        ORDER BY p.created_at DESC
        LIMIT 50
      `, tenantParams),
      // Team headcount for workforce
      pool.query(`SELECT COUNT(*) as count FROM team_members ${tenantFilter}`, tenantParams),
    ]);

    const portfolioValue = Number(invoicesResult.rows[0]?.portfolio_value || 0);
    const revenueYtd = Number(invoicesResult.rows[0]?.revenue_ytd || 0);
    const projectsActive = Number(projectsResult.rows[0]?.count || 0);
    const workforce = Number(teamResult.rows[0]?.count || 0);

    // Build projects array with RAG status and next milestone
    const projects = projectsResult.rows.map(p => ({
      id: p.id,
      name: p.name,
      client: p.client,
      value: Number(p.value) || 0,
      phase: p.phase || 'Pre-Construction',
      completion: Number(p.completion) || 0,
      nextMilestone: 'TBC', // Would need milestones table join
      pm: p.pm || 'Unassigned',
      ...getRagStatus(),
    }));

    res.json({
      kpis: {
        portfolioValue,
        projectsActive,
        revenueYtd,
        margin: 25, // Hardcoded until cost data is available
        workforce,
      },
      projects,
    });
  } catch (err) {
    console.error('[Executive Summary]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /executive/trends
 * Returns 6 months of { month, revenue, margin, headcount }
 */
router.get('/trends', async (req, res) => {
  try {
    const { filter: tenantFilter, params: tenantParams } = getTenantFilter(req);

    // Monthly revenue from paid invoices (last 6 months)
    const revenueQuery = `
      SELECT 
        DATE_TRUNC('month', issue_date) as month,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as revenue
      FROM invoices
      ${tenantFilter}
        AND status = 'paid'
        AND issue_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY DATE_TRUNC('month', issue_date)
      ORDER BY DATE_TRUNC('month', issue_date)
    `;

    // Monthly headcount from team_members
    // Note: team_members table doesn't have join_date, so we use current count as proxy
    const headcountQuery = `
      SELECT COUNT(*) as count FROM team_members
      ${tenantFilter}
    `;

    const [revenueResult, headcountResult] = await Promise.all([
      pool.query(revenueQuery, tenantParams),
      pool.query(headcountQuery, tenantParams),
    ]);

    // Build 6-month trend array
    const months = [];
    const now = new Date();
    const currentHeadcount = Number(headcountResult.rows[0]?.count || 0);

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Find matching revenue data
      const revenueRow = revenueResult.rows.find(r => {
        const rDate = new Date(r.month);
        return rDate.getFullYear() === monthStart.getFullYear() &&
               rDate.getMonth() === monthStart.getMonth();
      });

      const monthName = monthStart.toLocaleString('en-US', { month: 'short' });
      const year = monthStart.getFullYear();

      months.push({
        month: `${monthName} ${year}`,
        revenue: Number(revenueRow?.revenue || 0),
        margin: 25, // Hardcoded until cost data is available
        headcount: currentHeadcount, // Use current headcount for all months (no historical tracking)
      });
    }

    res.json(months);
  } catch (err) {
    console.error('[Executive Trends]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
