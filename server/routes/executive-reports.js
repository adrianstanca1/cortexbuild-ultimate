const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();
router.use(authMiddleware);

// Multi-tenancy: extract org/company context from auth
function getTenantFilter(req) {
  const auth = req.user || {};
  if (!auth.organization_id) return { filter: '', params: [] };
  // Append to existing WHERE clauses in this file.
  return { filter: ' AND organization_id = $1', params: [auth.organization_id] };
}

// RAG status: hardcoded green for now (would need baseline/budget tracking)
function getRagStatus() {
  // TODO: Implement dynamic RAG status calculation based on project performance metrics
  return {
    programme: 'dynamic-status',
    cost: 'dynamic-status',
    quality: 'dynamic-status',
    safety: 'dynamic-status',
  };
}

/**
 * GET /executive/summary
 * Returns KPIs, active projects, and trends for executive dashboard
 */
router.get('/summary', async (req, res) => {
  try {
    const { filter: tenantFilter, params: tenantParams } = getTenantFilter(req);

    const [invoicesResult, projectsCountResult, projectsListResult, teamResult] = await Promise.all([
      pool.query(
        `SELECT 
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as portfolio_value,
          COALESCE(SUM(CASE WHEN status = 'paid' AND EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE) THEN amount ELSE 0 END), 0) as revenue_ytd
        FROM invoices
        WHERE 1=1${tenantFilter}`,
        tenantParams,
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM projects WHERE status = 'active'${tenantFilter}`,
        tenantParams,
      ),
      pool.query(
        `SELECT 
          p.id,
          p.name,
          p.client,
          p.contract_value as value,
          p.phase,
          p.progress as completion,
          p.manager as pm,
          p.status
        FROM projects p
        WHERE p.status = 'active'${tenantFilter}
        ORDER BY p.created_at DESC
        LIMIT 50`,
        tenantParams,
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM team_members WHERE 1=1${tenantFilter}`,
        tenantParams,
      ),
    ]);

    const portfolioValue = Number(invoicesResult.rows[0]?.portfolio_value || 0);
    const revenueYtd = Number(invoicesResult.rows[0]?.revenue_ytd || 0);
    const projectsActive = Number(projectsCountResult.rows[0]?.count || 0);
    const workforce = Number(teamResult.rows[0]?.count || 0);

    const projects = projectsListResult.rows.map((project) => ({
      id: project.id,
      name: project.name,
      client: project.client,
      value: Number(project.value) || 0,
      phase: project.phase || 'Pre-Construction',
      completion: Number(project.completion) || 0,
      nextMilestone: 'TBC',
      pm: project.pm || 'Unassigned',
      ...getRagStatus(),
    }));

    res.json({
      kpis: {
        portfolioValue,
        projectsActive,
        revenueYtd,
        margin: 25, // TODO: Replace with dynamic margin calculation (actual cost vs revenue)
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

    const revenueWhere = `status = 'paid' AND issue_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'${tenantFilter}`;
    const revenueQuery = `
      SELECT 
        DATE_TRUNC('month', issue_date) as month,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as revenue
      FROM invoices
      WHERE ${revenueWhere}
      GROUP BY DATE_TRUNC('month', issue_date)
      ORDER BY DATE_TRUNC('month', issue_date)
    `;

    const headcountQuery = `
      SELECT COUNT(*) as count FROM team_members
      WHERE 1=1${tenantFilter}
    `;

    const [revenueResult, headcountResult] = await Promise.all([
      pool.query(revenueQuery, tenantParams),
      pool.query(headcountQuery, tenantParams),
    ]);

    const months = [];
    const now = new Date();
    const currentHeadcount = Number(headcountResult.rows[0]?.count || 0);

    for (let i = 5; i >= 0; i -= 1) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const revenueRow = revenueResult.rows.find((row) => {
        const rowDate = new Date(row.month);
        return (
          rowDate.getFullYear() === monthStart.getFullYear() &&
          rowDate.getMonth() === monthStart.getMonth()
        );
      });

      months.push({
        month: monthStart.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        revenue: Number(revenueRow?.revenue || 0),
        margin: 25, // TODO: Replace with dynamic margin calculation (actual cost vs revenue)
        headcount: currentHeadcount,
      });
    }

    res.json(months);
  } catch (err) {
    console.error('[Executive Trends]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
