const express = require('express');
const pool    = require('../db');

// Per-table column whitelists — prevents column-name injection
const ALLOWED_COLUMNS = {
  projects:         ['name','client','status','progress','budget','spent','start_date','end_date','manager','location','type','phase','workers','contract_value','description'],
  invoices:         ['number','client','project_id','project','amount','vat','cis_deduction','status','issue_date','due_date','description','payment_terms','bank_account','notes'],
  safety_incidents: ['type','title','severity','status','project_id','project','reported_by','reported_by_name','date','location','description','root_cause','corrective_actions','injured_party','immediate_actions'],
  rfis:             ['number','project_id','project','subject','question','priority','status','submitted_by','submitted_date','due_date','assigned_to','response','discipline','notes'],
  change_orders:    ['number','project_id','project','title','description','amount','status','submitted_date','approved_date','reason','schedule_impact','type','days_extension'],
  team_members:     ['name','role','trade','email','phone','status','cis_status','utr_number','ni_number','hours_this_week','rams_completed','notes','daily_rate','cscs_card','cscs_expiry'],
  equipment:        ['name','type','registration','status','location','next_service','daily_rate','hire_period','category','serial_number','ownership','inspection_due','mewp_check','project_id','supplier','notes'],
  subcontractors:   ['company','trade','contact','email','phone','status','cis_verified','cis_status','insurance_expiry','rams_approved','rams_status','current_project','contract_value','rating','utr_number','address','notes'],
  documents:        ['name','type','project_id','project','uploaded_by','version','size','status','category','discipline','file_url','date_issued','author'],
  timesheets:       ['worker_id','worker','project_id','project','week','regular_hours','overtime_hours','daywork_hours','total_pay','status','cis_deduction','notes'],
  meetings:         ['title','meeting_type','project_id','project','date','time','location','attendees','agenda','minutes','actions','status','link'],
  materials:        ['name','category','quantity','unit','unit_cost','total_cost','supplier','project_id','project','status','delivery_date','po_number','order_date','notes'],
  punch_list:       ['project_id','project','location','description','assigned_to','priority','status','due_date','photos','trade','item_number','category','resolution','notes'],
  inspections:      ['type','project_id','project','inspector','date','status','score','items','next_inspection','title','location','notes','findings','corrective_actions'],
  rams:             ['title','project_id','project','activity','version','status','created_by','approved_by','review_date','hazards','method_statement','ppe','signatures','required','risk_level','valid_from','valid_until','controls','reviewed_by','notes'],
  cis_returns:      ['contractor','utr','period','gross_payment','materials_cost','labour_net','cis_deduction','cis_rate','status','verification_status','payment_date','notes'],
  tenders:          ['title','client','value','deadline','status','probability','type','location','ai_score','notes','stage','result_date'],
  contacts:         ['name','company','role','email','phone','type','value','last_contact','status','projects','address','website','notes','rating'],
  risk_register:    ['title','project_id','project','category','likelihood','impact','risk_score','owner','status','mitigation','review_date','notes','contingency','description'],
  purchase_orders:  ['number','supplier','project_id','project','amount','status','order_date','delivery_date','items','notes','category'],
  daily_reports:    ['project_id','project','date','prepared_by','weather','temperature','workers_on_site','activities','materials','equipment','issues','photos','progress','temp_high','temp_low','delays','safety_observations','visitors','status','submitted_by'],
  // New construction modules
  variations:         ['ref','title','project_id','project','subcontractor','status','type','value','original_value','impact','submitted_date','responded_date','description','reason','affected_items','approval_chain','documents'],
  defects:            ['reference','title','project_id','project','location','description','priority','status','trade','raised_by','assigned_to','due_date','closed_date','photos','cost','category'],
  valuations:         ['reference','project_id','project','application_number','period_start','period_end','status','contractor_name','client_name','original_value','variations','total_value','retention','amount_due','submitted_date','certified_date','certified_by','notes'],
  specifications:     ['reference','title','project_id','project','section','version','status','description','specifications','materials','standards','approved_by','approved_date'],
  temp_works:        ['reference','title','project_id','project','description','type','status','location','design_by','approved_by','design_date','approval_date','erected_by','erected_date','inspected_by','inspected_date','load_capacity','notes'],
  signage:           ['reference','project_id','project','type','description','location','size','material','quantity','status','required_date','installed_date','installed_by','notes'],
  waste_management:  ['reference','project_id','project','waste_type','carrier','license_number','skip_number','collection_date','quantity','unit','cost','disposal_site','waste_code','status','notes'],
  sustainability:   ['project_id','project','metric_type','target','actual','unit','period','status','notes'],
  training:          ['reference','title','project_id','project','type','provider','duration','cost','attendees','status','scheduled_date','completed_date','certification','expiry_date','notes'],
  certifications:   ['reference','company','certification_type','body','grade','expiry_date','status','renewal_date','cost','scope','accreditation_number','notes'],
  prequalification: ['reference','contractor','project_id','project','questionnaire_type','status','score','approved_by','approved_date','expiry_date','documents','sections_completed','total_sections','notes'],
  lettings:         ['reference','project_id','project','package_name','trade','status','tender_closing_date','award_date','contractor','contract_value','notes'],
  measuring:        ['reference','project_id','project','survey_type','location','status','surveyor','survey_date','completed_date','areas','total_area','unit','notes'],
};

/**
 * Creates a standard CRUD router for any table.
 * @param {string} tableName - The PostgreSQL table name
 * @param {string} [orderCol='created_at'] - Column to order by
 */
function makeRouter(tableName, orderCol = 'created_at') {
  const router  = express.Router();
  const allowed = ALLOWED_COLUMNS[tableName] || [];

  function filterKeys(data) {
    return Object.keys(data).filter(k => allowed.includes(k) && data[k] !== undefined);
  }

  // GET / — list all
  router.get('/', async (req, res) => {
    try {
      const { rows } = await pool.query(`SELECT * FROM ${tableName} ORDER BY ${orderCol} DESC`);
      res.json(rows);
    } catch (err) {
      console.error(`[GET ${tableName}]`, err.message);
      res.status(500).json({ message: err.message });
    }
  });

  // GET /:id — get one
  router.get('/:id', async (req, res) => {
    try {
      const { rows } = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
      if (!rows[0]) return res.status(404).json({ message: 'Not found' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // POST / — create
  router.post('/', async (req, res) => {
    const keys = filterKeys(req.body);
    if (!keys.length) return res.status(400).json({ message: 'No valid fields provided' });

    const cols         = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values       = keys.map(k => req.body[k]);

    try {
      const { rows } = await pool.query(
        `INSERT INTO ${tableName} (${cols}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error(`[POST ${tableName}]`, err.message);
      res.status(500).json({ message: err.message });
    }
  });

  // PUT /:id — update
  router.put('/:id', async (req, res) => {
    const keys = filterKeys(req.body);
    if (!keys.length) return res.status(400).json({ message: 'No valid fields provided' });

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values    = [...keys.map(k => req.body[k]), req.params.id];

    try {
      const { rows } = await pool.query(
        `UPDATE ${tableName} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
        values
      );
      if (!rows[0]) return res.status(404).json({ message: 'Not found' });
      res.json(rows[0]);
    } catch (err) {
      console.error(`[PUT ${tableName}]`, err.message);
      res.status(500).json({ message: err.message });
    }
  });

  // DELETE /:id
  router.delete('/:id', async (req, res) => {
    try {
      const { rowCount } = await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [req.params.id]);
      if (!rowCount) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
}

module.exports = makeRouter;
