const express = require('express');
const { pool } = require('../db');

const router = express.Router();

/**
 * GET /api/weather-forecast
 * Returns a 7-day weather forecast aggregated from weather_logs or daily_reports.
 * Falls back to mock data if no real records exist.
 */
router.get('/weather-forecast', async (req, res) => {
  try {
    const auth = req.auth || {};
    const orgId = auth.organization_id;
    const isSuper = ['super_admin', 'company_owner'].includes(auth.role);

    let params = [];
    let where = '';
    if (orgId && !isSuper) {
      where = 'WHERE organization_id = $1';
      params.push(orgId);
    }

    // Attempt to fetch from weather_logs table
    let query = `
      SELECT
        TO_CHAR(date, 'Dy')  AS day,
        temperature          AS temp,
        conditions           AS conditions,
        project_id           AS project_id
      FROM weather_logs
      ${where}
      ORDER BY date DESC
      LIMIT 7
    `;

    const result = await pool.query(query, params);

    // If we have real weather data, map it; otherwise fall back to smart mock
    if (result.rows.length > 0) {
      const forecast = result.rows.map((r, idx) => ({
        day: r.day,
        temp: Number(r.temp) || 14,
        conditions: r.conditions || 'Partly cloudy',
        risk: classifyRisk(Number(r.temp) || 14, r.conditions),
        activity: suggestActivity(Number(r.temp) || 14, r.conditions),
        alternative: suggestAlternative(Number(r.temp) || 14, r.conditions),
      }));
      return res.json(forecast);
    }

    // Fallback: generate a plausible 5-day forecast based on recent daily_reports weather
    const dailyResult = await pool.query(`
      SELECT DISTINCT ON (TO_CHAR(date, 'Dy'))
        TO_CHAR(date, 'Dy')  AS day,
        weather              AS conditions,
        date                 AS report_date
      FROM daily_reports
      ${where ? where + ' AND weather IS NOT NULL' : 'WHERE weather IS NOT NULL'}
      ORDER BY TO_CHAR(date, 'Dy'), date DESC
      LIMIT 7
    `, params);

    if (dailyResult.rows.length > 0) {
      const forecast = dailyResult.rows.map((r) => {
        const tempMatch = String(r.conditions).match(/(\d+)/);
        const temp = tempMatch ? parseInt(tempMatch[1], 10) : 14;
        return {
          day: r.day,
          temp,
          conditions: r.conditions,
          risk: classifyRisk(temp, r.conditions),
          activity: suggestActivity(temp, r.conditions),
          alternative: suggestAlternative(temp, r.conditions),
        };
      });
      return res.json(forecast);
    }

    // Hard fallback – realistic mock forecast
    res.json([
      { day: 'Mon', temp: 14, conditions: 'Partly cloudy', risk: 'Low', activity: 'Concreting OK', alternative: 'None needed' },
      { day: 'Tue', temp: 12, conditions: 'Light rain', risk: 'Medium', activity: 'Roof work risky', alternative: 'Interior work' },
      { day: 'Wed', temp: 10, conditions: 'Heavy rain', risk: 'High', activity: 'All exterior suspended', alternative: 'M&E / fit-out' },
      { day: 'Thu', temp: 13, conditions: 'Overcast', risk: 'Medium', activity: 'Partial exterior', alternative: 'Phased approach' },
      { day: 'Fri', temp: 15, conditions: 'Sunny', risk: 'Low', activity: 'Full programme', alternative: 'On schedule' },
    ]);
  } catch (err) {
    console.error('weather-forecast error:', err);
    res.status(500).json({ error: err.message });
  }
});

function classifyRisk(temp, conditions) {
  const rainy = /rain|storm|thunder/i.test(String(conditions));
  if (rainy || temp < 5) return 'High';
  if (/cloudy|overcast|wind/i.test(String(conditions)) || temp < 10) return 'Medium';
  return 'Low';
}

function suggestActivity(temp, conditions) {
  const rainy = /rain|storm|thunder/i.test(String(conditions));
  if (rainy) return 'All exterior suspended';
  if (temp < 8) return 'Concreting risky';
  if (temp > 30) return 'Heat – early starts only';
  return 'All activities OK';
}

function suggestAlternative(temp, conditions) {
  const rainy = /rain|storm|thunder/i.test(String(conditions));
  if (rainy) return 'Interior fit-out, M&E, inspections';
  if (temp < 8) return 'Pre-fab, covered works, welfare';
  if (temp > 30) return 'Lates / nights, hydration protocols';
  return 'Proceed as planned';
}

module.exports = router;
