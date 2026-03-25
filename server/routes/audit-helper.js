const { pool } = require('../db');

async function logAudit({ auth, action, entityType, entityId, oldData, newData, ipAddress }) {
  try {
    await pool.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_data, new_data, ip_address, organization_id, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        auth?.userId || null,
        action,
        entityType,
        entityId || null,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        ipAddress || null,
        auth?.organization_id || null,
        auth?.company_id || null,
      ]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { logAudit };
