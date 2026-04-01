import { test, expect } from '@playwright/test'

// API tests for CortexBuild Ultimate backend
test.describe('API Health', () => {
  const API_BASE = process.env.API_BASE_URL || 'http://72.62.132.43:3001/api'

  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`)
    expect(response.ok()).toBeTruthy()
    
    const json = await response.json()
    expect(json.status).toBe('ok')
    expect(json.version).toBeDefined()
  })

  test('database health check', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health/database`)
    // May require auth - just check it's reachable
    expect([200, 401, 403]).toContain(response.status())
  })
})

test.describe('API Authentication', () => {
  const API_BASE = process.env.API_BASE_URL || 'http://72.62.132.43:3001/api'

  test('login with valid credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: process.env.TEST_USER_EMAIL || 'adrian.stanca1@gmail.com',
        password: process.env.TEST_USER_PASSWORD || 'Lolozania1',
      },
    })
    
    // Should return 200 with token
    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(json.token).toBeDefined()
    expect(json.user).toBeDefined()
  })

  test('login with invalid credentials fails', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      },
    })
    
    // Should return 401
    expect(response.status()).toBe(401)
  })

  test('register with new user', async ({ request }) => {
    const timestamp = Date.now()
    const response = await request.post(`${API_BASE}/auth/register`, {
      data: {
        email: `test_${timestamp}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User',
        company: 'Test Company',
      },
    })
    
    // Should return 201 or 400 (if email exists)
    expect([201, 400]).toContain(response.status())
  })
})

test.describe('API Projects', () => {
  const API_BASE = process.env.API_BASE_URL || 'http://72.62.132.43:3001/api'
  let authToken: string

  test.beforeEach(async ({ request }) => {
    // Login to get token
    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: process.env.TEST_USER_EMAIL || 'adrian.stanca1@gmail.com',
        password: process.env.TEST_USER_PASSWORD || 'Lolozania1',
      },
    })
    
    const json = await loginResponse.json()
    authToken = json.token
  })

  test('get projects list', async ({ request }) => {
    const response = await request.get(`${API_BASE}/projects`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    
    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(Array.isArray(json)).toBeTruthy()
  })

  test('create project', async ({ request }) => {
    const projectName = `Test Project ${Date.now()}`
    
    const response = await request.post(`${API_BASE}/projects`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        name: projectName,
        code: `TEST-${Date.now()}`,
        status: 'planning',
        budget: 100000,
      },
    })
    
    // Should return 201 or 400 (validation error)
    expect([201, 400]).toContain(response.status())
    
    if (response.status() === 201) {
      const json = await response.json()
      expect(json.id).toBeDefined()
      expect(json.name).toBe(projectName)
    }
  })
})

test.describe('API Documents', () => {
  const API_BASE = process.env.API_BASE_URL || 'http://72.62.132.43:3001/api'
  let authToken: string

  test.beforeEach(async ({ request }) => {
    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: process.env.TEST_USER_EMAIL || 'adrian.stanca1@gmail.com',
        password: process.env.TEST_USER_PASSWORD || 'Lolozania1',
      },
    })
    
    const json = await loginResponse.json()
    authToken = json.token
  })

  test('get documents list', async ({ request }) => {
    const response = await request.get(`${API_BASE}/documents`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    
    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(Array.isArray(json)).toBeTruthy()
  })

  test('get safety records', async ({ request }) => {
    const response = await request.get(`${API_BASE}/safety`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    
    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(Array.isArray(json)).toBeTruthy()
  })
})

test.describe('API Team', () => {
  const API_BASE = process.env.API_BASE_URL || 'http://72.62.132.43:3001/api'
  let authToken: string

  test.beforeEach(async ({ request }) => {
    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: process.env.TEST_USER_EMAIL || 'adrian.stanca1@gmail.com',
        password: process.env.TEST_USER_PASSWORD || 'Lolozania1',
      },
    })
    
    const json = await loginResponse.json()
    authToken = json.token
  })

  test('get team members', async ({ request }) => {
    const response = await request.get(`${API_BASE}/team-members`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    
    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(Array.isArray(json)).toBeTruthy()
  })

  test('get subcontractors', async ({ request }) => {
    const response = await request.get(`${API_BASE}/subcontractors`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    
    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(Array.isArray(json)).toBeTruthy()
  })
})
