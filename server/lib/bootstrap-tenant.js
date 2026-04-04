/**
 * Create organization + company rows (expects an active transaction on client).
 * @param {import('pg').PoolClient} client
 * @param {{ orgName: string, companyName?: string }} opts
 * @returns {Promise<{ organizationId: string, companyId: string }>}
 */
async function insertOrgAndCompany(client, { orgName, companyName }) {
  const name = orgName.trim();
  const comp = (companyName || name).trim();
  const { rows: [org] } = await client.query(
    `INSERT INTO organizations (id, name, description)
     VALUES (gen_random_uuid(), $1, $2)
     RETURNING id`,
    [name, `Organization for ${name}`]
  );
  const { rows: [company] } = await client.query(
    `INSERT INTO companies (id, organization_id, name, description)
     VALUES (gen_random_uuid(), $1, $2, $3)
     RETURNING id`,
    [org.id, comp, null]
  );
  return { organizationId: org.id, companyId: company.id };
}

/**
 * Attach a new org + company to an existing user (OAuth signup).
 * @param {import('pg').Pool} pool
 * @param {string} userId
 * @param {{ orgName: string, companyName?: string }} opts
 */
async function attachNewTenantToUser(pool, userId, { orgName, companyName }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { organizationId, companyId } = await insertOrgAndCompany(client, {
      orgName,
      companyName,
    });
    const comp = (companyName || orgName).trim();
    await client.query(
      `UPDATE users
       SET organization_id = $1, company_id = $2,
           company = CASE WHEN TRIM(COALESCE(company, '')) = '' THEN $3 ELSE company END
       WHERE id = $4`,
      [organizationId, companyId, comp, userId]
    );
    await client.query('COMMIT');
    return { organizationId, companyId };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { insertOrgAndCompany, attachNewTenantToUser };
