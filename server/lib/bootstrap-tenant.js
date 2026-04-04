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

/**
 * Single transaction: org + company + OAuth user (never persist user without tenant).
 * @param {import('pg').Pool} pool
 * @param {{ email: string, name: string, avatarUrl?: string | null }} profile
 * @param {{ orgName: string, companyName?: string }} tenantOpts
 */
async function createOAuthUserWithTenant(pool, { email, name, avatarUrl = null }, { orgName, companyName }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { organizationId, companyId } = await insertOrgAndCompany(client, {
      orgName,
      companyName,
    });
    const comp = (companyName || orgName).trim();
    const { rows } = await client.query(
      `INSERT INTO users (email, name, avatar_url, email_verified, organization_id, company_id, company)
       VALUES ($1, $2, $3, true, $4, $5, $6)
       RETURNING *`,
      [email.toLowerCase(), name, avatarUrl, organizationId, companyId, comp]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { insertOrgAndCompany, attachNewTenantToUser, createOAuthUserWithTenant };
