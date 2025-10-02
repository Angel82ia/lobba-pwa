import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import cookieParser from 'cookie-parser'
import reservationRoutes from '../../src/routes/reservation.js'
import pool from '../../src/config/database.js'
import { generateToken } from '../../src/utils/auth.js'

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/reservations', reservationRoutes)

describe('Reservation Controller', () => {
  let authToken
  let testUser
  let testSalon
  let testService

  beforeEach(async () => {
    await pool.query('DELETE FROM reservations')
    await pool.query('DELETE FROM salon_services')
    await pool.query('DELETE FROM salon_profiles')
    await pool.query('DELETE FROM users WHERE email LIKE \'%test-reservation-controller%\'')

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['test-reservation-controller-user@example.com', 'hash', 'Test', 'User', 'user']
    )
    testUser = userResult.rows[0]
    authToken = generateToken(testUser)

    const salonUserResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['test-reservation-controller-salon@example.com', 'hash', 'Test', 'Salon', 'salon']
    )
    const salonUser = salonUserResult.rows[0]

    const salonProfileResult = await pool.query(
      `INSERT INTO salon_profiles (user_id, business_name, address, city, phone, business_hours)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        salonUser.id,
        'Test Salon',
        '123 Test St',
        'Test City',
        '123456789',
        JSON.stringify({ monday: { open: '09:00', close: '18:00' } }),
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
    await pool.query('DELETE FROM users WHERE email LIKE \'%test-reservation-controller%\'')
  })

  describe('GET /api/reservations/slots', () => {
    it('should return available slots', async () => {
      const response = await request(app)
        .get('/api/reservations/slots')
        .query({
          salonId: testSalon.id,
          serviceId: testService.id,
          date: '2025-10-13',
        })
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/reservations/slots')
        .query({
          salonId: testSalon.id,
          serviceId: testService.id,
          date: '2025-10-13',
        })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/reservations', () => {
    it('should create a reservation', async () => {
      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          salonProfileId: testSalon.id,
          serviceId: testService.id,
          startTime: '2025-10-13T10:00:00Z',
          endTime: '2025-10-13T11:00:00Z',
          totalPrice: 50.00,
          clientPhone: '+1234567890',
          clientEmail: 'test@example.com',
        })

      expect(response.status).toBe(201)
      expect(response.body.status).toBe('pending')
    })

    it('should require authentication', async () => {
      const response = await request(app).post('/api/reservations').send({})
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/reservations/:id', () => {
    it('should get reservation by id', async () => {
      const reservation = await pool.query(
        `INSERT INTO reservations (user_id, salon_profile_id, service_id, start_time, end_time, total_price, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [testUser.id, testSalon.id, testService.id, '2025-10-13T10:00:00Z', '2025-10-13T11:00:00Z', 50.00, 'pending']
      )

      const response = await request(app)
        .get(`/api/reservations/${reservation.rows[0].id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(reservation.rows[0].id)
    })
  })

  describe('PUT /api/reservations/:id/cancel', () => {
    it('should cancel a reservation', async () => {
      const reservation = await pool.query(
        `INSERT INTO reservations (user_id, salon_profile_id, service_id, start_time, end_time, total_price, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [testUser.id, testSalon.id, testService.id, '2025-10-13T10:00:00Z', '2025-10-13T11:00:00Z', 50.00, 'pending']
      )

      const response = await request(app)
        .put(`/api/reservations/${reservation.rows[0].id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Test cancellation' })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('cancelled')
    })
  })
})
