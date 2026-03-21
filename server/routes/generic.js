const express = require('express');
const pool    = require('../db');

// Per-table column whitelists — prevents column-name injection
const ALLOWED_COLUMNS = {
  projects:         ['name','client','status','progress','budget','spent','start_date','end_date','manager','location','type','phase','workers','contract_value','description'],
  invoices:         ['number','client','project_id','project','amount','vat','cis_deduction','status','issue_date','due_date','description'],
  safety_incidents: ['type','title','severity','status','project_id','project','reported_by','reported_by_name','date','location','description','root_cause','corrective_actions','injured_party','immediate_actions'],
  rfis:             ['number','project_id','project','subject','question','priority','status','submitted_by','submitted_date','due_date','assigned_to','response','discipline','notes'],
  change_orders:    ['number','project_id','project','title','description','amount','status','submitted_date','approved_date','reason','schedule_impact','type','days_extension'],
  team_members:     ['name','role','trade','email','phone','status','cis_status','utr_number','ni_number','hours_this_week','rams_completed','notes','daily_rate','cscs_card','cscs_expiry'],
  equipment:        ['name','type','registration','status','location','next_service','daily_rate','hire_period','category','serial_number','ownership','inspection_due','mewp_check','project_id','supplier','notes'],
  subcontractors:   ['company','trade','contact','email','phone','status','cis_verified','insurance_expiry','rams_approved','current_project','contract_value','rating'],
  documents:        ['name','type','project_id','project','uploaded_by','version','size','status','category','discipline','file_url','date_issued','author'],
  timesheets:       ['worker_id','worker','project_id','project','week','regular_hours','overtime_hours','daywork_hours','total_pay','status','cis_deduction','notes'],
  meetings:         ['title','meeting_type','project_id','project','date','time','location','attendees','agenda','minutes','actions','status','link'],
  materials:        ['name','category','quantity','unit','unit_cost','total_cost','supplier','project_id','project','status','delivery_date','po_number','order_date','notes'],
  punch_list:       ['project_id','project','location','description','assigned_to','priority','status','due_date','photos','trade'],
  inspections:      ['type','project_id','project','inspector','date','status','score','items','next_inspection','title','location','notes','findings','corrective_actions'],
  rams:             ['title','project_id','project','activity','version','status','created_by','approved_by','review_date','hazards','method_statement','ppe','signatures','required','risk_level','valid_from','valid_until','controls','reviewed_by','notes'],
  cis_returns:      ['contractor','utr','period','gross_payment','materials_cost','labour_net','cis_deduction','status','verification_status'],
  tenders:          ['title','client','value','deadline','status','probability','type','location','ai_score','notes','stage','result_date'],
  contacts:         ['name','company','role','email','phone','type','value','last_contact','status','projects','address','website','notes','rating'],
  risk_register:    ['title','project_id','project','category','likelihood','impact','risk_score','owner','status','mitigation','review_date','notes','contingency','description'],
  purchase_orders:  ['number','supplier','project_id','project','amount','status','order_date','delivery_date','items','notes','category'],
  daily_reports:    ['project_id','project','date','prepared_by','weather','temperature','workers_on_site','activities','materials','equipment','issues','photos','progress'],
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
