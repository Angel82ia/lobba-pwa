import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import pool from '../../src/config/database.js'
import { getAvailableSlots } from '../../src/utils/slots.js'

describe('Slots Algorithm', () => {
  let testSalon
  let testService

  beforeEach(async () => {
    await pool.query('DELETE FROM reservations')
    await pool.query('DELETE FROM salon_services')
    await pool.query('DELETE FROM salon_profiles')
    await pool.query('DELETE FROM users WHERE email LIKE \'%test-slots%\'')

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['test-slots-salon@example.com', 'hash', 'Test', 'Salon', 'salon']
    )
    const salonUser = userResult.rows[0]

    const salonProfileResult = await pool.query(
      `INSERT INTO salon_profiles (user_id, business_name, address, city, phone, business_hours)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        salonUser.id,
        'Test Salon',
        '123 Test St',
        'Test City',
        '123456789',
        JSON.stringify({
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '10:00', close: '16:00' },
          sunday: null,
        }),
      ]
    )
    testSalon = salonProfileResult.rows[0]

    const serviceResult = await pool.query(
      `INSERT INTO salon_services (salon_profile_id, name, description, duration_minutes, price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [testSalon.id, 'Test Service', 'Test Description', 60, 50.00]
    )
    testService = serviceResult.rows[0]
  })

  afterEach(async () => {
    await pool.query('DELETE FROM reservations')
    await pool.query('DELETE FROM salon_services')
    await pool.query('DELETE FROM salon_profiles')
    await pool.query('DELETE FROM users WHERE email LIKE \'%test-slots%\'')
  })

  it('should return empty array for closed days', async () => {
    const slots = await getAvailableSlots({
      salonProfileId: testSalon.id,
      serviceId: testService.id,
      date: '2025-10-12',
    })

    expect(slots).toEqual([])
  })

  it('should generate slots based on business hours', async () => {
    const slots = await getAvailableSlots({
      salonProfileId: testSalon.id,
      serviceId: testService.id,
      date: '2025-10-13',
    })

    expect(slots.length).toBeGreaterThan(0)
    expect(slots[0]).toMatch(/^09:/)
  })

  it('should exclude slots with existing reservations', async () => {
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['test-slots-user@example.com', 'hash', 'Test', 'User', 'user']
    )
    const testUser = userResult.rows[0]

    await pool.query(
      `INSERT INTO reservations (user_id, salon_profile_id, service_id, start_time, end_time, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        testUser.id,
        testSalon.id,
        testService.id,
        '2025-10-13T10:00:00Z',
        '2025-10-13T11:00:00Z',
        50.00,
        'confirmed',
      ]
    )

    const slots = await getAvailableSlots({
      salonProfileId: testSalon.id,
      serviceId: testService.id,
      date: '2025-10-13',
    })

    const hasConflict = slots.some((slot) => slot === '10:00' || slot === '10:15' || slot === '10:30' || slot === '10:45')
    expect(hasConflict).toBe(false)
  })

  it('should respect buffer time around reservations', async () => {
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['test-slots-user2@example.com', 'hash', 'Test', 'User', 'user']
    )
    const testUser = userResult.rows[0]

    await pool.query(
      `INSERT INTO reservations (user_id, salon_profile_id, service_id, start_time, end_time, total_price, status, buffer_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        testUser.id,
        testSalon.id,
        testService.id,
        '2025-10-13T12:00:00Z',
        '2025-10-13T13:00:00Z',
        50.00,
        'confirmed',
        15,
      ]
    )

    const slots = await getAvailableSlots({
      salonProfileId: testSalon.id,
      serviceId: testService.id,
      date: '2025-10-13',
    })

    const hasBufferConflict = slots.some((slot) => slot === '11:45' || slot === '13:00')
    expect(hasBufferConflict).toBe(false)
  })
})
