import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import pool from '../../src/config/database.js'
import { createUser, findUserByEmail, findUserById } from '../../src/models/User.js'

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST
})

beforeEach(async () => {
  await pool.query('DELETE FROM users')
})

afterAll(async () => {
  await pool.end()
})

describe('User Model', () => {
  it('should create a new user', async () => {
    const user = await createUser({
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
    })

    expect(user).toBeDefined()
    expect(user.email).toBe('test@example.com')
    expect(user.role).toBe('user')
  })

  it('should find user by email', async () => {
    await createUser({
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
    })

    const user = await findUserByEmail('test@example.com')
    expect(user).toBeDefined()
    expect(user.email).toBe('test@example.com')
  })

  it('should find user by id', async () => {
    const createdUser = await createUser({
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
    })

    const user = await findUserById(createdUser.id)
    expect(user).toBeDefined()
    expect(user.id).toBe(createdUser.id)
  })
})
