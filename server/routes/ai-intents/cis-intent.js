const pool = require('../../db');

/**
 * Handle CIS (Construction Industry Scheme) intent - return CIS compliance summaries.
 * @returns {Promise<{reply: string, data: object, suggestions: string[]}>}
 */
async function handleCIS() {
  const { rows } = await pool.query(
    `SELECT name, company, ni_number, utr, cis_status, last_cis_return FROM cis_workers ORDER BY created_at DESC`
  );
  if (!rows.length) {
    return {
      reply: 'No CIS worker records found.',
      data: { count: 0 },
      suggestions: ['Show me team members', 'Show me subcontractors', 'Check compliance']
    };
  }
  const verified  = rows.filter(r => r.cis_status === 'verified');
  const pending   = rows.filter(r => r.cis_status === 'pending' || r.cis_status === 'unverified');
  const overdue   = rows.filter(r => r.last_cis_return && new Date(r.last_cis_return) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  let reply = `You have **${rows.length} CIS workers** — ${verified.length} verified, ${pending.length} pending/unverified.\n`;
  if (overdue.length) {
    reply += `⚠️ ${overdue.length} workers due for CIS return submission.\n\n`;
    reply += 'Overdue CIS returns:\n';
    overdue.slice(0, 5).forEach(w => {
      reply += `• ${w.name} — ${w.company || 'No company'}, last return ${w.last_cis_return ? new Date(w.last_cis_return).toLocaleDateString('en-GB') : 'N/A'}\n`;
    });
  } else {
    reply += '\nAll CIS returns are up to date.';
  }

  return {
    reply,
    data: { count: rows.length, verified: verified.length, pending: pending.length, overdue: overdue.length, workers: rows },
    suggestions: [
      'Show me unverified workers',
      'Submit CIS returns',
      'Show me subcontractors'
    ]
  };
}

module.exports = {
  handleCIS,
};
