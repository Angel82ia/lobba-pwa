import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import pool from '../../src/config/database.js'
import * as Reservation from '../../src/models/Reservation.js'

describe('Reservation Model', () => {
  let testUser
  let testSalon
  let testService

  beforeEach(async () => {
    await pool.query('DELETE FROM reservations')
    await pool.query('DELETE FROM salon_services')
    await pool.query('DELETE FROM salon_profiles')
    await pool.query('DELETE FROM users WHERE email LIKE \'%test-reservation%\'')

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['test-reservation-user@example.com', 'hash', 'Test', 'User', 'user']
    )
    testUser = userResult.rows[0]

    const salonResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['test-reservation-salon@example.com', 'hash', 'Test', 'Salon', 'salon']
    )
    const salonUser = salonResult.rows[0]

    const salonProfileResult = await pool.query(
      `INSERT INTO salon_profiles (user_id, business_name, address, city, phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [salonUser.id, 'Test Salon', '123 Test St', 'Test City', '123456789']
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
    await pool.query('DELETE FROM users WHERE email LIKE \'%test-reservation%\'')
  })

  describe('createReservation', () => {
    it('should create a new reservation with default pending status', async () => {
      const startTime = new Date('2025-10-10T10:00:00Z')
      const endTime = new Date('2025-10-10T11:00:00Z')

      const reservation = await Reservation.createReservation({
        userId: testUser.id,
        salonProfileId: testSalon.id,
        serviceId: testService.id,
        startTime,
        endTime,
        totalPrice: 50.00,
        notes: 'Test reservation',
        clientPhone: '123456789',
        clientEmail: 'test@example.com',
      })

      expect(reservation).toBeDefined()
      expect(reservation.user_id).toBe(testUser.id)
      expect(reservation.salon_profile_id).toBe(testSalon.id)
      expect(reservation.service_id).toBe(testService.id)
      expect(reservation.status).toBe('pending')
      expect(reservation.total_price).toBe('50.00')
    })

    it('should create reservation with buffer_minutes', async () => {
      const reservation = await Reservation.createReservation({
        userId: testUser.id,
        salonProfileId: testSalon.id,
        serviceId: testService.id,
        startTime: new Date('2025-10-10T10:00:00Z'),
        endTime: new Date('2025-10-10T11:00:00Z'),
        totalPrice: 50.00,
        bufferMinutes: 15,
      })

      expect(reservation.buffer_minutes).toBe(15)
    })
  })

  describe('findReservationById', () => {
    it('should find reservation by id', async () => {
      const created = await Reservation.createReservation({
        userId: testUser.id,
        salonProfileId: testSalon.id,
        serviceId: testService.id,
        startTime: new Date('2025-10-10T10:00:00Z'),
        endTime: new Date('2025-10-10T11:00:00Z'),
        totalPrice: 50.00,
      })

      const found = await Reservation.findReservationById(created.id)
      expect(found).toBeDefined()
      expect(found.id).toBe(created.id)
    })

    it('should return null for non-existent id', async () => {
      const found = await Reservation.findReservationById('00000000-0000-0000-0000-000000000000')
      expect(found).toBeNull()
    })
  })

  describe('findReservationsByUserId', () => {
    it('should find all reservations for a user', async () => {
      await Reservation.createReservation({
        userId: testUser.id,
        salonProfileId: testSalon.id,
        serviceId: testService.id,
        startTime: new Date('2025-10-10T10:00:00Z'),
        endTime: new Date('2025-10-10T11:00:00Z'),
        totalPrice: 50.00,
      })

      await Reservation.createReservation({
        userId: testUser.id,
        salonProfileId: testSalon.id,
        serviceId: testService.id,
        startTime: new Date('2025-10-11T10:00:00Z'),
        endTime: new Date('2025-10-11T11:00:00Z'),
        totalPrice: 50.00,
      })

      const reservations = await Reservation.findReservationsByUserId(testUser.id)
      expect(reservations).toHaveLength(2)
    })

    it('should filter by status', async () => {
      const pending = await Reservation.createReservation({
        userId: testUser.id,
        salonProfileId: testSalon.id,
        serviceId: testService.id,
        startTime: new Date('2025-10-10T10:00:00Z'),
        endTime: new Date('2025-10-10T11:00:00Z'),
        totalPrice: 50.00,
      })

      await Reservation.updateReservationStatus(pending.id, 'confirmed')

      await Reservation.createReservation({
        userId: testUser.id,
        salonProfileId: testSalon.id,
        serviceId: testService.id,
        startTime: new Date('2025-10-11T10:00:00Z'),
        endTime: new Date('2025-10-11T11:00:00Z'),
        totalPrice: 50.00,
      })

      const confirmed = await Reservation.findReservationsByUserId(testUser.id, { status: 'confirmed' })
      expect(confirmed).toHaveLength(1)
      expect(confirmed[0].status).toBe('confirmed')
    })

    it('should filter by date range', async () => {
      await Reservation.createReservation({
        userId: testUser.id,
        salonProfileId: testSalon.id,
        serviceId: testService.id,
        startTime: new Date('2025-10-10T10:00:00Z'),
        endTime: new Date('2025-10-10T11:00:00Z'),
        totalPrice: 50.00,
      })

      await Reservation.createReservation({
        userId: testUser.id,
        salonProfileId: testSalon.id,
        serviceId: testService.id,
        startTime: new Date('2025-10-20T10:00:00Z'),
        endTime: new Date('2025-10-20T11:00:00Z'),
        totalPrice: 50.00,
      })

      const filtered = await Reservation.findReservationsByUserId(testUser.id, {
        startDate: '2025-10-01',
        endDate: '2025-10-15',
      })
      expect(filtered).toHaveLength(1)
    })
  })

  describe('findReservationsBySalonId', () => {
    it('should find all reservations for a salon', async () => {
      await Reservation.createReservation({
        userId: testUser.id,
        salonProfileId: testSalon.id,
        serviceId: testService.id,
        startTime: new Date('2025-10-10T10:00:00Z'),
        endTime: new Date('2025-10-10T11:00:00Z'),
        totalPrice: 50.00,
      })

      const reservations = await Reservation.findReservationsBySalonId(testSalon.id)
      expect(reservations).toHaveLength(1)
    })
  })

  describe('updateReservationStatus', () => {
    it('should update reservation status', async () => {
      const reservation = await Reservation.createReservation({
        userId: testUser.id,
        salonProfileId: testSalon.id,
        serviceId: testService.id,
        startTime: new Date('2025-10-10T10:00:00Z'),
        endTime: new Date('2025-10-10T11:00:00Z'),
        totalPrice: 50.00,
      })

      const updated = await Reservation.updateReservationStatus(reservation.id, 'confirmed')
      expect(updated.status).toBe('confirmed')
    })

    it('should update with metadata', async () => {
      const reservation = await Reservation.createReservation({
        userId: testUser.id,
        salonProfileId: testSalon.id,
        serviceId: testService.id,
        startTime: new Date('2025-10-10T10:00:00Z'),
        endTime: new Date('2025-10-10T11:00:00Z'),
        totalPrice: 50.00,
      })

      const updated = await Reservation.updateReservationStatus(
        reservation.id,
        'confirmed',
        { googleCalendarEventId: 'test-event-123' }
      )
      expect(updated.google_calendar_event_id).toBe('test-event-123')
    })
  })

  describe('cancelReservation', () => {
    it('should cancel reservation and store reason', async () => {
      const reservation = await Reservation.createReservation({
        userId: testUser.id,
        salonProfileId: testSalon.id,
        serviceId: testService.id,
        startTime: new Date('2025-10-10T10:00:00Z'),
        endTime: new Date('2025-10-10T11:00:00Z'),
        totalPrice: 50.00,
      })

      const cancelled = await Reservation.cancelReservation(reservation.id, 'Client requested')
      expect(cancelled.status).toBe('cancelled')
      expect(cancelled.cancellation_reason).toBe('Client requested')
    })
  })
})
