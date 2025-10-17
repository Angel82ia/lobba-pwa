import { describe, it, expect, beforeEach, vi } from 'vitest'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js', () => ({
  default: {
    query: vi.fn()
  }
}))

const { getSalonSettings, updateSalonSettings, requiresManualApproval } = await import('../../src/models/SalonSettings.js')

describe('SalonSettings Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSalonSettings', () => {
    it('should return existing settings', async () => {
      const mockSettings = {
        id: '123',
        salon_profile_id: 'salon-1',
        auto_confirm_enabled: true,
        auto_confirm_min_hours: 2
      }

      pool.query.mockResolvedValue({
        rows: [mockSettings]
      })

      const result = await getSalonSettings('salon-1')

      expect(result).toEqual(mockSettings)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM salon_settings'),
        ['salon-1']
      )
    })

    it('should create settings if not exist', async () => {
      const newSettings = {
        id: '456',
        salon_profile_id: 'salon-2',
        auto_confirm_enabled: true
      }

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [newSettings] })

      const result = await getSalonSettings('salon-2')

      expect(result).toEqual(newSettings)
      expect(pool.query).toHaveBeenCalledTimes(2)
    })
  })

  describe('updateSalonSettings', () => {
    it('should update allowed fields', async () => {
      const updated = {
        id: '123',
        auto_confirm_enabled: false,
        buffer_minutes: 30
      }

      pool.query.mockResolvedValue({
        rows: [updated]
      })

      const result = await updateSalonSettings('salon-1', {
        auto_confirm_enabled: false,
        buffer_minutes: 30,
        invalid_field: 'should_be_ignored'
      })

      expect(result).toEqual(updated)
    })

    it('should throw error if no valid fields', async () => {
      await expect(
        updateSalonSettings('salon-1', { invalid: 'field' })
      ).rejects.toThrow('No valid fields to update')
    })
  })

  describe('requiresManualApproval', () => {
    it('should return true if auto_confirm disabled', async () => {
      pool.query.mockResolvedValue({
        rows: [{
          auto_confirm_enabled: false,
          manual_approval_services: []
        }]
      })

      const result = await requiresManualApproval('salon-1', 'service-1')

      expect(result).toBe(true)
    })

    it('should return true if service in manual list', async () => {
      pool.query.mockResolvedValue({
        rows: [{
          auto_confirm_enabled: true,
          manual_approval_services: ['service-1', 'service-2']
        }]
      })

      const result = await requiresManualApproval('salon-1', 'service-1')

      expect(result).toBe(true)
    })

    it('should return false if auto_confirm and service not in list', async () => {
      pool.query.mockResolvedValue({
        rows: [{
          auto_confirm_enabled: true,
          manual_approval_services: ['service-2']
        }]
      })

      const result = await requiresManualApproval('salon-1', 'service-1')

      expect(result).toBe(false)
    })
  })
})
