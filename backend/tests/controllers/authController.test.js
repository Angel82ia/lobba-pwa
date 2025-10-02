import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/index.js'
import pool from '../../src/config/database.js'

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST
  await pool.query('DELETE FROM refresh_tokens')
  await pool.query('DELETE FROM users')
})

afterAll(async () => {
  await pool.end()
})

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
      })

    expect(response.status).toBe(201)
    expect(response.body.user).toBeDefined()
    expect(response.body.user.email).toBe('newuser@example.com')
    expect(response.body.tokens.accessToken).toBeDefined()
    expect(response.body.tokens.refreshToken).toBeDefined()
  })

  it('should not register with existing email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'Duplicate',
        lastName: 'User',
      })

    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  it('should validate email format', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      })

    expect(response.status).toBe(400)
  })

  it('should validate password length', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test2@example.com',
        password: 'short',
        firstName: 'Test',
        lastName: 'User',
      })

    expect(response.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      })

    expect(response.status).toBe(200)
    expect(response.body.user).toBeDefined()
    expect(response.body.tokens.accessToken).toBeDefined()
    expect(response.body.tokens.refreshToken).toBeDefined()
  })

  it('should not login with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'newuser@example.com',
        password: 'WrongPassword',
      })

    expect(response.status).toBe(401)
  })

  it('should not login with non-existent user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      })

    expect(response.status).toBe(401)
  })
})

describe('POST /api/auth/refresh', () => {
  let refreshToken

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      })
    
    refreshToken = response.body.tokens.refreshToken
  })

  it('should refresh access token with valid refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })

    expect(response.status).toBe(200)
    expect(response.body.accessToken).toBeDefined()
  })

  it('should not refresh with invalid token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-token' })

    expect(response.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  let accessToken

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      })
    
    accessToken = response.body.tokens.accessToken
  })

  it('should return user data with valid token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.email).toBe('newuser@example.com')
    expect(response.body.id).toBeDefined()
  })

  it('should not return data without token', async () => {
    const response = await request(app)
      .get('/api/auth/me')

    expect(response.status).toBe(401)
  })

  it('should not return data with invalid token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token')

    expect(response.status).toBe(401)
  })
})

describe('POST /api/auth/logout', () => {
  let accessToken

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      })
    
    accessToken = response.body.tokens.accessToken
  })

  it('should logout successfully with valid token', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(204)
  })

  it('should not logout without token', async () => {
    const response = await request(app)
      .post('/api/auth/logout')

    expect(response.status).toBe(401)
  })
})
