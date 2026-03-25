const express = require('express');
const pool    = require('../db');
const { logAudit } = require('./audit-helper');

// Per-table column whitelists — prevents column-name injection
const ALLOWED_COLUMNS = {
  projects:         ['name','client','status','progress','budget','spent','start_date','end_date','manager','location','type','phase','workers','contract_value','description'],
  invoices:         ['number','client','project_id','project','amount','vat','cis_deduction','status','issue_date','due_date','description','payment_terms','bank_account','notes'],
  safety_incidents: ['type','title','severity','status','project_id','project','reported_by','reported_by_name','date','location','description','root_cause','corrective_actions','injured_party','immediate_actions','riddor_reportable','injury_type','body_part_affected','days_lost','witness_name','target_closure_date'],
  rfis:             ['number','project_id','project','rfi_number','subject','question','priority','status','submitted_by','submitted_date','due_date','assigned_to','response','discipline','notes','ball_in_court','cost_impact','schedule_impact'],
  change_orders:    ['number','co_number','project_id','project','title','description','amount','value','status','submitted_date','approved_date','reason','schedule_impact','days_extension','rejection_reason','cost_change','schedule_change','type'],
  team_members:    ['name','role','trade','trade_type','email','phone','status','cis_status','utr_number','ni_number','hours_this_week','rams_completed','notes','daily_rate','cscs_card','cscs_expiry','cscs_type'],
  equipment:        ['name','type','registration','status','location','next_service','daily_rate','hire_period','category','serial_number','ownership','inspection_due','mewp_check','project_id','supplier','notes'],
  subcontractors:   ['company','trade','contact','email','phone','status','cis_verified','cis_status','insurance_expiry','rams_approved','rams_status','current_project','contract_value','rating','utr_number','address','notes'],
  documents:        ['name','type','project_id','project','uploaded_by','version','size','status','category','discipline','file_url','date_issued','author'],
  timesheets:       ['worker_id','worker','project_id','project','week','regular_hours','overtime_hours','daywork_hours','total_pay','status','cis_deduction','notes'],
  meetings:         ['title','meeting_type','project_id','project','date','time','location','attendees','agenda','minutes','actions','status','link'],
  materials:        ['name','category','quantity','unit','unit_cost','total_cost','supplier','project_id','project','status','delivery_date','po_number','order_date','notes'],
  punch_list:       ['project_id','project','location','description','assigned_to','priority','status','due_date','photos','trade','item_number','category','resolution','notes'],
  inspections:      ['type','project_id','project','inspector','date','status','score','items','next_inspection','title','location','notes','findings','corrective_actions'],
  rams:             ['title','project_id','project','activity','doc_type','version','status','created_by','approved_by','review_date','hazards','method_statement','ppe','signatures','required','risk_level','valid_from','valid_until','controls','reviewed_by','likelihood','severity','notes'],
  cis_returns:      ['contractor','utr','period','gross_payment','materials_cost','labour_net','cis_deduction','cis_rate','status','verification_status','payment_date','notes'],
  tenders:          ['title','client','value','deadline','status','probability','type','location','ai_score','notes','stage','result_date'],
  contacts:         ['name','company','role','email','phone','type','value','last_contact','status','projects','address','website','notes','rating'],
  risk_register:    ['title','project_id','project','category','likelihood','impact','risk_score','owner','status','mitigation','review_date','notes','contingency','description'],
  purchase_orders:  ['number','supplier','project_id','project','amount','status','order_date','delivery_date','items','notes','category'],
  daily_reports:   ['project_id','project','date','prepared_by','weather','temperature','workers_on_site','activities','materials','equipment','issues','photos','progress','temp_high','temp_low','delays','safety_observations','visitors','status','submitted_by'],
  variations:        ['ref','title','project_id','project','subcontractor','status','type','value','original_value','impact','submitted_date','responded_date','description','reason','affected_items','approval_chain','documents'],
  defects:           ['reference','title','project_id','project','location','description','priority','status','trade','raised_by','assigned_to','due_date','closed_date','photos','cost','category'],
  valuations:        ['reference','project_id','project','application_number','period_start','period_end','status','contractor_name','client_name','original_value','variations','total_value','retention','amount_due','submitted_date','certified_date','certified_by','notes'],
  specifications:    ['reference','title','project_id','project','section','version','status','description','specifications','materials','standards','approved_by','approved_date'],
  temp_works:        ['reference','title','project_id','project','description','type','status','location','design_by','approved_by','design_date','approval_date','erected_by','erected_date','inspected_by','inspected_date','load_capacity','notes'],
  signage:           ['reference','project_id','project','type','description','location','size','material','quantity','status','required_date','installed_date','installed_by','notes'],
  waste_management:  ['reference','project_id','project','waste_type','carrier','license_number','skip_number','collection_date','quantity','unit','cost','disposal_site','waste_code','status','notes'],
  sustainability:   ['project_id','project','metric_type','target','actual','unit','period','status','notes'],
  training:          ['reference','title','project_id','project','type','provider','duration','cost','attendees','status','scheduled_date','completed_date','certification','expiry_date','notes'],
  certifications:   ['reference','company','certification_type','body','grade','expiry_date','status','renewal_date','cost','scope','accreditation_number','notes'],
  prequalification: ['reference','contractor','project_id','project','questionnaire_type','status','score','approved_by','approved_date','expiry_date','documents','sections_completed','total_sections','notes'],
  lettings:         ['reference','project_id','project','package_name','trade','status','tender_closing_date','award_date','contractor','contract_value','notes'],
  measuring:        ['reference','project_id','project','survey_type','location','status','surveyor','survey_date','completed_date','areas','total_area','unit','notes'],
  site_permits:      ['type','site','issued_by','from_date','to_date','status'],
  equipment_service_logs: ['equipment_id','date','type','technician','notes','next_due'],
  equipment_hire_logs:   ['equipment_id','name','company','daily_rate','start_date','end_date','project','status'],
  risk_mitigation_actions: ['risk_id','title','owner','due_date','status','progress'],
  contact_interactions: ['contact_id','type','date','note'],
  safety_permits:     ['permit_no','type','project','location','start_date','end_date','issued_by','status'],
  toolbox_talks:      ['date','topic','location','presenter','attendees','signed_off'],
  drawing_transmittals: ['project','issued_to','date','purpose','status'],
};

const VALID_ORDER_COLS = new Set([
  'id', 'created_at', 'updated_at', 'name', 'status', 'date',
  'title', 'project', 'priority', 'severity', 'type',
  'submitted_date', 'due_date', 'start_date', 'end_date',
  'amount', 'value', 'cost', 'contract_value',
]);

const SUPER_ADMIN_ROLES = new Set(['super_admin', 'company_owner']);

/**
 * Build WHERE clause for tenant-scoped queries.
 * Super admins see all data; others only see their org/company.
 */
function buildTenantFilter(req) {
  if (!req.user) return '';
  if (SUPER_ADMIN_ROLES.has(req.user.role)) return '';
  if (req.user.organization_id) {
    return ` WHERE organization_id = $1`;
  }
  return '';
}

/**
 * Creates a standard CRUD router for any table.
 * @param {string} tableName - The PostgreSQL table name
 * @param {string} [orderCol='created_at'] - Column to order by
 */
function makeRouter(tableName, orderCol = 'created_at') {
  if (!ALLOWED_COLUMNS[tableName]) {
    throw new Error(`Table "${tableName}" not allowed`);
  }
  const safeOrderCol = VALID_ORDER_COLS.has(orderCol) ? orderCol : 'created_at';
  const router  = express.Router();
  const allowed = ALLOWED_COLUMNS[tableName];

  function filterKeys(data) {
    return Object.keys(data).filter(k => allowed.includes(k) && data[k] !== undefined);
  }

  function buildFilterAndParams(req) {
    if (!req.user) return { filter: '', params: [] };
    if (SUPER_ADMIN_ROLES.has(req.user.role)) return { filter: '', params: [] };
    if (req.user.organization_id) {
      return { filter: ' WHERE organization_id = $1', params: [req.user.organization_id] };
    }
    return { filter: '', params: [] };
  }

  function buildFilterWithId(req, idParamIndex) {
    const { filter, params } = buildFilterAndParams(req);
    if (!filter) {
      return { filter: ` WHERE id = $${idParamIndex}`, params: [req.params.id] };
    }
    return { filter: `${filter} AND id = $${params.length + 1}`, params: [...params, req.params.id] };
  }

  // GET / — list all (paginated)
  router.get('/', async (req, res) => {
    try {
      const page     = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit    = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 100));
      const offset   = (page - 1) * limit;
      const { filter, params: filterParams } = buildFilterAndParams(req);
      const queryParams = [...filterParams, limit, offset];
      const paramLimit = filterParams.length + 1;
      const paramOffset = filterParams.length + 2;
      const { rows } = await pool.query(
        `SELECT * FROM ${tableName}${filter} ORDER BY ${safeOrderCol} DESC LIMIT $${paramLimit} OFFSET $${paramOffset}`,
        queryParams
      );
      const countResult = await pool.query(`SELECT COUNT(*) as total FROM ${tableName}${filter}`, filterParams);
      res.json({
        data: rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total, 10),
          pages: Math.ceil(parseInt(countResult.rows[0].total, 10) / limit),
        },
      });
    } catch (err) {
      console.error(`[GET ${tableName}]`, err.message);
      res.status(500).json({ message: err.message });
    }
  });

  // GET /:id — get one
  router.get('/:id', async (req, res) => {
    try {
      const { filter, params } = buildFilterWithId(req, 1);
      const { rows } = await pool.query(`SELECT * FROM ${tableName}${filter}`, params);
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

    // Auto-inject tenant columns on insert
    let colSuffix = '';
    let valSuffix = '';
    const tenantValues = [];
    if (req.user && req.user.organization_id) {
      colSuffix = ', organization_id';
      valSuffix = `, $${values.length + 1}`;
      tenantValues.push(req.user.organization_id);
      if (req.user.company_id) {
        colSuffix += ', company_id';
        valSuffix += `, $${values.length + 2}`;
        tenantValues.push(req.user.company_id);
      }
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO ${tableName} (${cols}${colSuffix}) VALUES (${placeholders}${valSuffix}) RETURNING *`,
        [...values, ...tenantValues]
      );
      logAudit({ auth: req.user, action: 'create', entityType: tableName, entityId: rows[0]?.id, newData: rows[0] });
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
    const values    = [...keys.map(k => req.body[k])];

    const { filter, params: filterParams } = buildFilterWithId(req, keys.length + 1);
    values.push(...filterParams);

    try {
      const { rows } = await pool.query(
        `UPDATE ${tableName} SET ${setClause}${filter} RETURNING *`,
        values
      );
      if (!rows[0]) return res.status(404).json({ message: 'Not found' });
      logAudit({ auth: req.user, action: 'update', entityType: tableName, entityId: rows[0]?.id, newData: rows[0] });
      res.json(rows[0]);
    } catch (err) {
      console.error(`[PUT ${tableName}]`, err.message);
      res.status(500).json({ message: err.message });
    }
  });

  // DELETE /:id
  router.delete('/:id', async (req, res) => {
    try {
      const { filter, params } = buildFilterWithId(req, 1);
      const oldRows = await pool.query(`SELECT * FROM ${tableName}${filter}`, params);
      if (!oldRows.rowCount) return res.status(404).json({ message: 'Not found' });
      const { rowCount } = await pool.query(`DELETE FROM ${tableName}${filter}`, params);
      logAudit({ auth: req.user, action: 'delete', entityType: tableName, entityId: req.params.id, oldData: oldRows.rows[0] });
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
}

module.exports = makeRouter;
