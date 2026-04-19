/**
 * Intent classifier for AI chat requests.
 * Maps user messages to domain-specific intent handlers.
 */

/**
 * Classify user message into intent category.
 * @param {string} message - User message text
 * @returns {string} Intent identifier
 */
function classify(message) {
  const m = message.toLowerCase();
  const intents = [];

  if (/overdue/.test(m))                                                                        intents.push('overdue');
  if (/budget/.test(m))                                                                         intents.push('budget');
  if (/\brams\b|\bram\b|method statement|risk assessment/.test(m))                             intents.push('rams');
  if (/\bcis\b|cis return|cis returns|construction industry scheme|deduction/.test(m))         intents.push('cis');
  if (/daily report|daily reports|site diary|progress report/.test(m))                         intents.push('daily_reports');
  if (/risk register|hazard register|\brisk\b|\brisks\b/.test(m))                              intents.push('risk');
  if (/change order|change orders|variation|variations|\bco\b|\bvo\b/.test(m))                 intents.push('change_orders');
  if (/purchase order|purchase orders|\bprocurement\b|supplier order/.test(m))                 intents.push('purchase_orders');
  if (/\bpo\b/.test(m))                                                                         intents.push('purchase_orders');
  if (/subcontractor|subcontractors|subbies|\bcontractor\b|sub-contractor/.test(m))            intents.push('subcontractors');
  if (/\bequipment\b|\bplant\b|machinery|\bcrane\b|excavator|\bvehicle\b|\bhire\b/.test(m))    intents.push('equipment');
  if (/\bmaterial\b|\bmaterials\b|\bsupplies\b|\bdelivery\b|\bstock\b/.test(m))                intents.push('materials');
  if (/timesheet|timesheets|\bhours\b|\bpayroll\b|overtime/.test(m))                           intents.push('timesheets');
  if (/\bcontact\b|\bcontacts\b|\bclient\b|\bclients\b|\bcrm\b|prospect/.test(m))              intents.push('contacts');
  if (/project/.test(m))                                                                        intents.push('projects');
  if (/invoice|invoices|payment|payments|cash/.test(m))                                        intents.push('invoices');
  if (/safety|incident|hazard|near.?miss|accident/.test(m))                                    intents.push('safety');
  if (/team|worker|staff|member|employee/.test(m))                                             intents.push('team');
  if (/\brfi\b|rfis/.test(m))                                                                   intents.push('rfis');
  if (/tender|bid|bidding|pipeline/.test(m))                                                   intents.push('tenders');
  if (/valuation|valuations|payment application|interim certificate|prime cost|PC sums/.test(m)) intents.push('valuations');
  if (/defect|defects|snag|snags|punch list|punchlist|items? list|closing/.test(m))             intents.push('defects');

  // Autonomous features
  if (/research|deep search|investigate|analyse in depth|synthesise|comprehensive report|multi.source|across all/i.test(m)) intents.push('autoresearch');
  if (/improve|optimize|optimise|recommend|better|inefficien|trend|trends over time|historical|metrics analysis/i.test(m)) intents.push('autoimprove');
  if (/diagnose|repair|fix|heal|self.repair|infrastructure|container|ollama|embeddings|corrupt/i.test(m)) intents.push('autorepair');

  return intents.length > 0 ? intents : ['unknown'];
}

/**
 * Determine whether to use Ollama LLM or rule-based response.
 * @param {string} message - User message text
 * @param {string} intent - Classified intent
 * @returns {boolean} True if LLM should be used
 */
function shouldUseOllama(message, intent) {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  if (intent === 'unknown') return false;
  if (trimmed.length >= 20) return true;
  if (/[?]/.test(trimmed)) return true;

  if (/(summari[sz]e|explain|analyse|analyze|compare|why|how|what|which|should|recommend|advice|insight|status of|tell me)/.test(lower)) {
    return true;
  }

  if (/^(show|list|give|get|open)\b/.test(lower) && trimmed.length < 20) {
    return false;
  }

  // Short commands like "hi", "thanks", single-word inputs → rule-based
  return false;
}

module.exports = {
  classify,
  shouldUseOllama,
};
