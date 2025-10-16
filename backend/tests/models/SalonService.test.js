import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import pool from '../../src/config/database.js'
import {
  createService,
  findServiceById,
  findServicesBySalonId,
  updateService,
  deleteService,
} from '../../src/models/SalonService.js'

vi.mock('../../src/config/database.js')

describe('SalonService Model', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createService', () => {
    it('should create a new service with all fields', async () => {
      const mockResult = {
        rows: [
          {
            id: 'service-uuid',
            salon_profile_id: 'salon-uuid',
            name: 'Corte de Pelo',
            description: 'Corte profesional',
            price: 25.0,
            duration_minutes: 30,
            discount_percentage: 15,
            is_active: true,
            sort_order: 1,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
          },
        ],
      }

      pool.query.mockResolvedValue(mockResult)

      const serviceData = {
        salonProfileId: 'salon-uuid',
        name: 'Corte de Pelo',
        description: 'Corte profesional',
        price: 25.0,
        durationMinutes: 30,
        discountPercentage: 15,
      }

      const result = await createService(serviceData)

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['salon-uuid', 'Corte de Pelo', 'Corte profesional', 25.0, 30, 15])
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('INSERT INTO salon_services')
      expect(result).toEqual(mockResult.rows[0])
    })

    it('should create service with minimal fields', async () => {
      const mockResult = {
        rows: [
          {
            id: 'service-uuid',
            salon_profile_id: 'salon-uuid',
            name: 'Manicura',
            price: 15.0,
            duration_minutes: 20,
            discount_percentage: 0,
          },
        ],
      }

      pool.query.mockResolvedValue(mockResult)

      const serviceData = {
        salonProfileId: 'salon-uuid',
        name: 'Manicura',
        price: 15.0,
        durationMinutes: 20,
      }

      const result = await createService(serviceData)

      expect(pool.query).toHaveBeenCalled()
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('findServiceById', () => {
    it('should find service by ID', async () => {
      const mockResult = {
        rows: [
          {
            id: 'service-uuid',
            name: 'Corte de Pelo',
            price: 25.0,
          },
        ],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await findServiceById('service-uuid')

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['service-uuid'])
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('SELECT')
      expect(sqlQuery).toContain('salon_services')
      expect(sqlQuery).toContain('WHERE id = $1')
      expect(result).toEqual(mockResult.rows[0])
    })

    it('should return undefined when service not found', async () => {
      const mockResult = { rows: [] }
      pool.query.mockResolvedValue(mockResult)

      const result = await findServiceById('nonexistent')

      expect(result).toBeUndefined()
    })
  })

  describe('findServicesBySalonId', () => {
    it('should return all active services for a salon', async () => {
      const mockResult = {
        rows: [
          {
            id: 'service-1',
            salon_profile_id: 'salon-uuid',
            name: 'Corte de Pelo',
            price: 25.0,
            is_active: true,
          },
          {
            id: 'service-2',
            salon_profile_id: 'salon-uuid',
            name: 'Manicura',
            price: 15.0,
            is_active: true,
          },
        ],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await findServicesBySalonId('salon-uuid')

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['salon-uuid'])
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('SELECT')
      expect(sqlQuery).toContain('salon_services')
      expect(sqlQuery).toContain('WHERE salon_profile_id = $1')
      expect(sqlQuery).toContain('is_active = true')
      expect(sqlQuery).toContain('ORDER BY')
      expect(result).toEqual(mockResult.rows)
    })

    it('should return all services including inactive when specified', async () => {
      const mockResult = {
        rows: [
          {
            id: 'service-1',
            name: 'Active Service',
            is_active: true,
          },
          {
            id: 'service-2',
            name: 'Inactive Service',
            is_active: false,
          },
        ],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await findServicesBySalonId('salon-uuid', { includeInactive: true })

      expect(pool.query).toHaveBeenCalled()
      expect(result).toEqual(mockResult.rows)
    })

    it('should return empty array when no services found', async () => {
      const mockResult = { rows: [] }
      pool.query.mockResolvedValue(mockResult)

      const result = await findServicesBySalonId('salon-uuid')

      expect(result).toEqual([])
    })
  })

  describe('updateService', () => {
    it('should update service fields', async () => {
      const mockResult = {
        rows: [
          {
            id: 'service-uuid',
            name: 'Corte de Pelo Premium',
            price: 30.0,
            discount_percentage: 20,
          },
        ],
      }

      pool.query.mockResolvedValue(mockResult)

      const updates = {
        name: 'Corte de Pelo Premium',
        price: 30.0,
        discountPercentage: 20,
      }

      const result = await updateService('service-uuid', updates)

      expect(pool.query).toHaveBeenCalled()
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('UPDATE salon_services')
      expect(sqlQuery).toContain('updated_at = CURRENT_TIMESTAMP')
      expect(result).toEqual(mockResult.rows[0])
    })

    it('should handle empty updates', async () => {
      const mockResult = {
        rows: [
          {
            id: 'service-uuid',
            name: 'Existing Service',
          },
        ],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await updateService('service-uuid', {})

      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('deleteService', () => {
    it('should soft delete service', async () => {
      const mockResult = {
        rows: [
          {
            id: 'service-uuid',
            is_active: false,
          },
        ],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await deleteService('service-uuid')

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['service-uuid'])
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('UPDATE salon_services')
      expect(sqlQuery).toContain('is_active = false')
      expect(result).toEqual(mockResult.rows[0])
    })
  })
})
