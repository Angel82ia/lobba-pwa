import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import pool from '../../src/config/database.js'
import { 
  createSalonProfile,
  findSalonProfileByUserId,
  findSalonProfileById,
  updateSalonProfile,
  deleteSalonProfile
} from '../../src/models/SalonProfile.js'

vi.mock('../../src/config/database.js')

describe('SalonProfile Model', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createSalonProfile', () => {
    it('should create salon profile with location', async () => {
      const mockResult = {
        rows: [{
          id: 'salon-uuid',
          user_id: 'user-uuid',
          business_name: 'Beauty Salon',
          description: 'Professional beauty services',
          address: 'Calle Example 123',
          city: 'Madrid',
          postal_code: '28001',
          phone: '+34600000000',
          location: 'POINT(-3.7037902 40.4167754)',
          business_hours: JSON.stringify({
            monday: { open: '09:00', close: '18:00' }
          }),
          is_click_collect: false,
          accepts_reservations: true,
          rating: 0.0,
          total_reviews: 0,
          is_active: true,
          verified: false,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }]
      }

      pool.query.mockResolvedValue(mockResult)

      const profileData = {
        userId: 'user-uuid',
        businessName: 'Beauty Salon',
        description: 'Professional beauty services',
        address: 'Calle Example 123',
        city: 'Madrid',
        postalCode: '28001',
        phone: '+34600000000',
        location: { latitude: 40.4167754, longitude: -3.7037902 },
        businessHours: {
          monday: { open: '09:00', close: '18:00' }
        }
      }

      const result = await createSalonProfile(profileData)

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO salon_profiles'),
        expect.arrayContaining([
          'user-uuid',
          'Beauty Salon',
          'Professional beauty services',
          'Calle Example 123',
          'Madrid',
          '28001',
          '+34600000000',
          expect.any(String), // JSON stringified business hours
          -3.7037902, // longitude
          40.4167754  // latitude
        ])
      )
      expect(result).toEqual(mockResult.rows[0])
    })

    it('should create salon profile without location', async () => {
      const mockResult = {
        rows: [{
          id: 'salon-uuid',
          user_id: 'user-uuid',
          business_name: 'Beauty Salon',
          location: null
        }]
      }

      pool.query.mockResolvedValue(mockResult)

      const profileData = {
        userId: 'user-uuid',
        businessName: 'Beauty Salon',
        location: null
      }

      const result = await createSalonProfile(profileData)

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO salon_profiles'),
        expect.not.arrayContaining(['longitude', 'latitude'])
      )
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('findSalonProfileByUserId', () => {
    it('should find salon profile by user ID with coordinates', async () => {
      const mockResult = {
        rows: [{
          id: 'salon-uuid',
          user_id: 'user-uuid',
          business_name: 'Beauty Salon',
          latitude: 40.4167754,
          longitude: -3.7037902
        }]
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await findSalonProfileByUserId('user-uuid')

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user-uuid']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('SELECT sp.*')
      expect(sqlQuery).toContain('ST_Y(sp.location::geometry) as latitude')
      expect(sqlQuery).toContain('ST_X(sp.location::geometry) as longitude')
      expect(sqlQuery).toContain('WHERE sp.user_id = $1')
      expect(result).toEqual(mockResult.rows[0])
    })

    it('should return undefined when salon profile not found', async () => {
      const mockResult = { rows: [] }
      pool.query.mockResolvedValue(mockResult)

      const result = await findSalonProfileByUserId('nonexistent-user')

      expect(result).toBeUndefined()
    })
  })

  describe('findSalonProfileById', () => {
    it('should find salon profile by ID', async () => {
      const mockResult = {
        rows: [{
          id: 'salon-uuid',
          business_name: 'Beauty Salon'
        }]
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await findSalonProfileById('salon-uuid')

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT sp.*'),
        ['salon-uuid']
      )
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('updateSalonProfile', () => {
    it('should update salon profile with location', async () => {
      const mockResult = {
        rows: [{
          id: 'salon-uuid',
          business_name: 'Updated Salon',
          latitude: 41.3874,
          longitude: 2.1686
        }]
      }

      pool.query.mockResolvedValue(mockResult)

      const updates = {
        business_name: 'Updated Salon',
        location: { latitude: 41.3874, longitude: 2.1686 }
      }

      const result = await updateSalonProfile('salon-uuid', updates)

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['Updated Salon', 2.1686, 41.3874, 'salon-uuid']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('UPDATE salon_profiles')
      expect(sqlQuery).toContain('business_name = $1')
      expect(sqlQuery).toContain('ST_SetSRID(ST_MakePoint($2, $3), 4326)')
      expect(result).toEqual(mockResult.rows[0])
    })

    it('should update salon profile without location', async () => {
      const mockResult = {
        rows: [{
          id: 'salon-uuid',
          business_name: 'Updated Salon'
        }]
      }

      pool.query.mockResolvedValue(mockResult)

      const updates = {
        business_name: 'Updated Salon'
      }

      const result = await updateSalonProfile('salon-uuid', updates)

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['Updated Salon', 'salon-uuid']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('UPDATE salon_profiles')
      expect(sqlQuery).toContain('business_name = $1')
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('deleteSalonProfile', () => {
    it('should soft delete salon profile', async () => {
      const mockResult = {
        rows: [{
          id: 'salon-uuid',
          is_active: false
        }]
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await deleteSalonProfile('salon-uuid')

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['salon-uuid']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('UPDATE salon_profiles')
      expect(sqlQuery).toContain('is_active = false')
      expect(result).toEqual(mockResult.rows[0])
    })
  })
})
