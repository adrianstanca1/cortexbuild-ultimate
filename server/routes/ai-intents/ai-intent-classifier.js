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
