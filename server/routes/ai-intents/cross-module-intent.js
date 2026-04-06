/**
 * Cross-Module Intent Handler
 * Coordinates data gathering from multiple domain-specific handlers
 * to synthesize a comprehensive answer.
 */

const { handleProjects } = require('./projects-intent');
const { handleInvoices, handleOverdue } = require('./invoices-intent');
const { handleSafety } = require('./safety-intent');
const { handleTeam } = require('./team-intent');
const { handleRfis } = require('./rfis-intent');
const { handleTenders } = require('./tenders-intent');
const { handleBudget } = require('./budget-intent');
const { handleValuations } = require('./valuations-intent');
const { handleDefects } = require('./defects-intent');
const { handleMaterials } = require('./materials-intent');
const { handleTimesheets } = require('./timesheets-intent');
const { handleSubcontractors } = require('./subcontractors-intent');
const { handleEquipment } = require('./equipment-intent');
const { handleChangeOrders } = require('./change-orders-intent');
const { handlePurchaseOrders } = require('./purchase-orders-intent');
const { handleContacts } = require('./contacts-intent');
const { handleRams } = require('./rams-intent');
const { handleCIS } = require('./cis-intent');
const { handleDailyReports } = require('./daily-reports-intent');
const { handleRisk } = require('./risk-intent');

const HANDLERS = {
  projects: handleProjects,
  invoices: handleInvoices,
  overdue: handleOverdue,
  safety: handleSafety,
  team: handleTeam,
  rfis: handleRfis,
  tenders: handleTenders,
  budget: handleBudget,
  valuations: handleValuations,
  defects: handleDefects,
  materials: handleMaterials,
  timesheets: handleTimesheets,
  subcontractors: handleSubcontractors,
  equipment: handleEquipment,
  change_orders: handleChangeOrders,
  purchase_orders: handlePurchaseOrders,
  contacts: handleContacts,
  rams: handleRams,
  cis: handleCIS,
  daily_reports: handleDailyReports,
  risk: handleRisk,
};

/**
 * Handle queries that match multiple intents.
 * @param {string[]} intents - Array of detected intents
 * @param {string} message - Original user message
 * @returns {Promise<{reply: string, data: any, suggestions: string[]}>}
 */
async function handleCrossModule(intents, message) {
  const results = {};
  const promises = intents.map(async (intent) => {
    const handler = HANDLERS[intent];
    if (handler) {
      try {
        const res = await handler();
        results[intent] = res;
      } catch (e) {
        console.error(`[CrossModule] Error in handler ${intent}:`, e.message);
      }
    }
  });

  await Promise.all(promises);

  // Synthesis: Create a combined summary of the findings
  // Note: The LLM (via server/routes/ai.js) will further refine this.
  const summaryParts = [];
  for (const [intent, res] of Object.entries(results)) {
    summaryParts.push(`--- ${intent.toUpperCase()} ---\n${res.reply}`);
  }

  return {
    reply: summaryParts.length > 0
      ? `I've gathered information from multiple areas:\n\n${summaryParts.join('\n\n')}`
      : `I found multiple related areas, but couldn't retrieve specific data for them.`,
    data: results,
    suggestions: [
      'Can you synthesize this into a report?',
      'Which of these is the highest priority?',
      'Show me the details for one of these'
    ]
  };
}

module.exports = { handleCrossModule };
