import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import oliviaService from '../../src/services/oliviaService.js'
import pool from '../../src/config/database.js'

describe('Olivia Service', () => {
  let testUserId
  let testSalonId
  let testServiceId

  beforeAll(async () => {
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ('olivia-test@test.com', 'hash', 'socia')
       RETURNING id`
    )
    testUserId = userResult.rows[0].id

    const salonUserResult = await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ('salon-olivia@test.com', 'hash', 'salon')
       RETURNING id`
    )

    const salonResult = await pool.query(
      `INSERT INTO salon_profiles (user_id, business_name, city, accepts_reservations)
       VALUES ($1, 'Salón Test Olivia', 'Madrid', true)
       RETURNING id`,
      [salonUserResult.rows[0].id]
    )
    testSalonId = salonResult.rows[0].id

    const serviceResult = await pool.query(
      `INSERT INTO salon_services (salon_id, name, price, duration_minutes, category)
       VALUES ($1, 'Corte de Cabello', 25.00, 30, 'cabello')
       RETURNING id`,
      [testSalonId]
    )
    testServiceId = serviceResult.rows[0].id
  })

  afterAll(async () => {
    await pool.query('DELETE FROM salon_services WHERE salon_id = $1', [testSalonId])
    await pool.query('DELETE FROM salon_profiles WHERE id = $1', [testSalonId])
    await pool.query('DELETE FROM users WHERE email IN ($1, $2)', [
      'olivia-test@test.com',
      'salon-olivia@test.com'
    ])
  })

  describe('searchSalons', () => {
    it('should search salons by city', async () => {
      const result = await oliviaService.searchSalons({ city: 'Madrid' })
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('business_name')
    })

    it('should search salons by query', async () => {
      const result = await oliviaService.searchSalons({ query: 'Test' })
      expect(result).toBeInstanceOf(Array)
    })
  })

  describe('getSalonDetails', () => {
    it('should get salon details with services', async () => {
      const result = await oliviaService.getSalonDetails({ salonId: testSalonId })
      expect(result).toHaveProperty('salon')
      expect(result).toHaveProperty('services')
      expect(result).toHaveProperty('hours')
      expect(result.salon.business_name).toBe('Salón Test Olivia')
      expect(result.services.length).toBeGreaterThan(0)
    })

    it('should return error for non-existent salon', async () => {
      const result = await oliviaService.getSalonDetails({
        salonId: '00000000-0000-0000-0000-000000000000'
      })
      expect(result).toHaveProperty('error')
    })
  })

  describe('checkAvailability', () => {
    it('should check availability for a date', async () => {
      const result = await oliviaService.checkAvailability({
        salonId: testSalonId,
        date: '2025-11-01'
      })
      expect(result).toHaveProperty('date')
      expect(result).toHaveProperty('slots')
    })
  })

  describe('searchProducts', () => {
    it('should search products by query', async () => {
      const result = await oliviaService.searchProducts({ query: 'shampoo' })
      expect(result).toBeInstanceOf(Array)
    })

    it('should search products by category', async () => {
      const result = await oliviaService.searchProducts({ category: 'cabello' })
      expect(result).toBeInstanceOf(Array)
    })
  })

  describe('getMembershipInfo', () => {
    it('should get Essential membership info', async () => {
      const result = await oliviaService.getMembershipInfo({ membershipType: 'essential' })
      expect(result).toHaveProperty('name', 'Essential')
      expect(result).toHaveProperty('benefits')
      expect(result.benefits.hygiene_units).toBe(16)
      expect(result.benefits.ar_credits).toBe(50)
    })

    it('should get Spirit membership info', async () => {
      const result = await oliviaService.getMembershipInfo({ membershipType: 'spirit' })
      expect(result).toHaveProperty('name', 'Spirit')
      expect(result).toHaveProperty('benefits')
      expect(result.benefits.hygiene_units).toBe(32)
      expect(result.benefits.ar_credits).toBe(50)
    })

    it('should get all memberships if no type specified', async () => {
      const result = await oliviaService.getMembershipInfo({})
      expect(result).toHaveProperty('essential')
      expect(result).toHaveProperty('spirit')
    })
  })

  describe('createReservation', () => {
    it('should create a reservation successfully', async () => {
      const result = await oliviaService.createReservation({
        userId: testUserId,
        salonId: testSalonId,
        serviceId: testServiceId,
        date: '2025-11-15',
        time: '10:00',
        notes: 'Test reservation'
      })

      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('reservation')
      expect(result.reservation).toHaveProperty('id')
      expect(result.reservation.service).toBe('Corte de Cabello')

      await pool.query('DELETE FROM reservations WHERE id = $1', [result.reservation.id])
    })

    it('should return error for non-existent salon', async () => {
      const result = await oliviaService.createReservation({
        userId: testUserId,
        salonId: '00000000-0000-0000-0000-000000000000',
        serviceId: testServiceId,
        date: '2025-11-15',
        time: '10:00'
      })

      expect(result).toHaveProperty('error')
    })
  })
})
