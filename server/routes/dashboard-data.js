const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/overview', async (req, res) => {
  try {
    const auth = req.user || {};
    const orgId = auth.organization_id;
    const isSuper = ['super_admin', 'company_owner'].includes(auth.role);

    let params = [];
    let where = ;
    if (orgId && !isSuper) {
      where = WHERE organization_id = ;
      params.push(orgId);
    }

    const [projectsResult, invoicesResult, rfisResult, safetyResult, teamResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM projects ${where}`, params),
      pool.query(`SELECT
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status IN ('pending','unpaid','sent','draft') THEN amount ELSE 0 END), 0) as outstanding
        FROM invoices ${where}`, params),
      pool.query(`SELECT COUNT(*) as count FROM rfis WHERE status = 'open' ${where ? (params.length ?  AND organization_id =  : ) : }`, params),
      pool.query(`SELECT COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END), 0) as closed
        FROM safety_incidents ${where}`, params),
      pool.query(`SELECT COUNT(*) as count FROM team_members ${where}`, params),
    ]);

    const activeProjects = Number(projectsResult.rows[0]?.count ?? 0);
    const totalRevenue = Number(invoicesResult.rows[0]?.total_revenue ?? 0);
    const outstanding = Number(invoicesResult.rows[0]?.outstanding ?? 0);
    const openRfis = Number(rfisResult.rows[0]?.count ?? 0);
    const safetyTotal = Number(safetyResult.rows[0]?.total ?? 0);
    const safetyClosed = Number(safetyResult.rows[0]?.closed ?? 0);
    const hsScore = safetyTotal > 0 ? Math.round((safetyClosed / safetyTotal) * 100) : 100;
    const workforce = Number(teamResult.rows[0]?.count ?? 0);

    res.json({
      kpi: {
        activeProjects,
        totalRevenue,
        outstanding,
        openRfis,
        hsScore,
        workforce,
      },
    });
  } catch (err) {
    console.error(dashboard overview error:, err);
    res.status(500).json({ error: err.message });
  }
});

router.get(/revenue, async (req, res) => {
  try {
    const auth = req.user || {};
    const orgId = auth.organization_id;
    const isSuper = ['super_admin', 'company_owner'].includes(auth.role);

    let params = [];
    let where = ;
    if (orgId && !isSuper) {
      where = WHERE organization_id = ;
      params.push(orgId);
    }

    const result = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC(month, due_date), Mon) as month,
        DATE_TRUNC(month, due_date) as sort_key,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as revenue
      FROM invoices
      ${where}
      GROUP BY DATE_TRUNC(month, due_date)
      ORDER BY sort_key
      LIMIT 12
    `, params);

    const revenueData = result.rows.map(r => ({
      month: r.month,
      revenue: Number(r.revenue),
    }));

    res.json(revenueData);
  } catch (err) {
    console.error(dashboard revenue error:, err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
