const request = require('supertest');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const app = require('../index');
const { expect } = require('chai');

describe('Security Regression Suite: IDOR Prevention', () => {
  let userA, userB;
  let resourceA;

  before(async () => {
    // Create two distinct companies/orgs
    const orgA = 'org_a_123';
    const orgB = 'org_b_456';
    const compA = 'comp_a_123';
    const compB = 'comp_b_456';

    // Mock users with different tenant IDs
    userA = {
      id: 'user_a',
      organization_id: orgA,
      company_id: compA,
      role: 'admin'
    };
    userB = {
      id: 'user_b',
      organization_id: orgB,
      company_id: compB,
      role: 'admin'
    };

    // Generate JWTs
    const secret = process.env.JWT_SECRET;
    userA.token = jwt.sign({ ...userA, jti: 'jti_a' }, secret);
    userB.token = jwt.sign({ ...userB, jti: 'jti_b' }, secret);

    // Setup a resource belonging to Company A
    const { rows } = await pool.query(
      `INSERT INTO projects (organization_id, company_id, name)
       VALUES ($1, $2, 'Project A') RETURNING id`,
      [orgA, compA]
    );
    resourceA = rows[0].id;
  });

  after(async () => {
    // Cleanup
    await pool.query('DELETE FROM projects WHERE id = $1', [resourceA]);
  });

  it('should deny access to a project belonging to another company (IDOR)', async () => {
    const response = await request(app)
      .get(`/api/projects/${resourceA}`)
      .set('Authorization', `Bearer ${userB.token}`);

    expect(response.status).to.equal(404);
  });

  it('should prevent updating a project belonging to another company', async () => {
    const response = await request(app)
      .put(`/api/projects/${resourceA}`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ name: 'Hacked Project' });

    expect(response.status).to.equal(404);
  });

  it('should prevent deleting a project belonging to another company', async () => {
    const response = await request(app)
      .delete(`/api/projects/${resourceA}`)
      .set('Authorization', `Bearer ${userB.token}`);

    expect(response.status).to.equal(404);
  });

  it('should allow access to a project belonging to the user own company', async () => {
    const response = await request(app)
      .get(`/api/projects/${resourceA}`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(response.status).to.equal(200);
  });
});
