const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const { getOllamaResponse, LLM_MODEL } = require('./ai-intents/ollama-client');
const { logAudit } = require('./audit-helper');

const router = express.Router();
router.use(auth);

/**
 * POST /api/ai/predictive-costs/forecast
 * Analyzes budget vs actuals and predicts project cost overruns.
 */
router.post('/forecast', async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: 'projectId is required' });

  const orgId = req.user?.organization_id;
  const isCompanyOwner = req.user?.role === 'company_owner';
  const isSuper = req.user?.role === 'super_admin';

  try {
    // 1. Gather Project Financial Baseline
    let projWhere = 'WHERE id = $1';
    let projParams = [projectId];
    if (isCompanyOwner) { projWhere += ' AND company_id = $2'; projParams.push(req.user.company_id); }
    else if (!isSuper && (orgId || req.user.company_id)) { projWhere += ' AND COALESCE(organization_id, company_id) = $2'; projParams.push(orgId || req.user.company_id); }
    const { rows: [project] } = await pool.query(
      `SELECT name, budget, spent, progress, start_date, end_date FROM projects ${projWhere}`,
      projParams
    );

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // 2. Gather Detailed Budget Item Variance
    const { rows: budgetItems } = await (orgId
      ? pool.query(
          `SELECT name, budgeted, spent, variance, variance_percent
           FROM budget_items WHERE project_id = $1 AND COALESCE(organization_id, company_id) = $2`,
          [projectId, orgId]
        )
      : req.user?.company_id
        ? pool.query(
            `SELECT name, budgeted, spent, variance, variance_percent
             FROM budget_items WHERE project_id = $1 AND company_id = $2`,
            [projectId, req.user.company_id]
          )
        : pool.query(`SELECT name, budgeted, spent, variance, variance_percent FROM budget_items WHERE 1=0`)
    );

    // 3. Gather Historical Forecasts to see trend
    const { rows: forecasts } = await pool.query(
      `SELECT period_start, projected_cost, actual_cost
       FROM cost_forecasts WHERE project_id = $1 AND company_id = $2 ORDER BY period_start ASC`,
      [projectId, req.user.company_id]
    );

    // 4. Construct Analysis Context for AI
    const budgetSummary = budgetItems.map(item =>
      `- ${item.name}: Budget £${item.budgeted}, Spent £${item.spent}, Variance ${item.variance_percent}%`
    ).join('\\n');

    const forecastTrend = forecasts.map(f =>
      `- Period ${f.period_start}: Projected £${f.projected_cost}, Actual £${f.actual_cost || 'N/A'}`
    ).join('\\n');

    const prompt = `
      You are an expert Construction Cost Consultant. Analyze the following project financial data and provide a predictive risk assessment.

      PROJECT: ${project.name}
      Current Progress: ${project.progress}%
      Total Budget: £${project.budget}
      Total Spent: £${project.spent}
      Timeline: ${project.start_date} to ${project.end_date}

      BUDGET ITEM BREAKDOWN:
      ${budgetSummary}

      HISTORICAL FORECAST TRENDS:
      ${forecastTrend}

      TASK:
      1. Calculate the "Burn Rate" (current spend relative to progress).
      2. Predict the Estimate at Completion (EAC) — what will the final cost likely be?
      3. Assign a Risk Level: LOW, MEDIUM, or HIGH based on variance trends.
      4. Provide 3 concise, actionable recommendations to mitigate overruns.

      Format the response as a JSON object:
      {
        "riskLevel": "LOW|MEDIUM|HIGH",
        "predictedFinalCost": number,
        "confidenceScore": number (0-100),
        "analysis": "detailed explanation",
        "recommendations": ["rec 1", "rec 2", "rec 3"]
      }
    `.trim();

    const aiResponse = await getOllamaResponse(prompt, 'Predictive Cost Analysis', [], null);

    // Attempt to parse JSON from AI response
    let parsedResult;
    try {
      // Remove markdown code blocks if present
      const cleaned = aiResponse.replace(/```json|```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    } catch (e) {
      console.error('[AI Predictive] JSON parse failed, using fallback', e.message);
      parsedResult = {
        riskLevel: 'MEDIUM',
        predictedFinalCost: project.budget * 1.1,
        confidenceScore: 50,
        analysis: aiResponse,
        recommendations: ['Review budget items', 'Audit current spend', 'Update forecasts']
      };
    }

    logAudit({
      auth: req.user,
      action: 'predictive_analysis',
      entityType: 'projects',
      entityId: projectId,
      newData: parsedResult
    });

    res.json({
      projectId,
      projectName: project.name,
      ...parsedResult
    });

  } catch (err) {
    console.error('[AI Predictive /forecast]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
