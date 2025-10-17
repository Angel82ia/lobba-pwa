import { describe, it, expect, beforeEach, vi } from 'vitest'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js', () => ({
  default: {
    query: vi.fn(),
    connect: vi.fn(() => ({
      query: vi.fn(),
      release: vi.fn()
    }))
  }
}))

const { checkSlotAvailability, getSalonCapacity } = await import('../../src/services/availabilityService.js')

describe('Availability Service - Capacity System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSalonCapacity', () => {
    it('should return capacity for salon with capacity enabled', async () => {
      pool.query.mockResolvedValue({
        rows: [{
          simultaneous_capacity: 3,
          capacity_enabled: true
        }]
      })

      const result = await getSalonCapacity(1)

      expect(result).toEqual({
        capacityEnabled: true,
        maxCapacity: 3
      })
    })

    it('should return default capacity for salon with capacity disabled', async () => {
      pool.query.mockResolvedValue({
        rows: [{
          simultaneous_capacity: 5,
          capacity_enabled: false
        }]
      })

      const result = await getSalonCapacity(1)

      expect(result).toEqual({
        capacityEnabled: false,
        maxCapacity: 1
      })
    })

    it('should throw error if salon not found', async () => {
      pool.query.mockResolvedValue({
        rows: []
      })

      await expect(getSalonCapacity(999)).rejects.toThrow('Salon not found')
    })
  })

  describe('checkSlotAvailability', () => {
    const mockClient = {
      query: vi.fn(),
      release: vi.fn()
    }

    it('should return available=true when under capacity', async () => {
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            simultaneous_capacity: 3,
            capacity_enabled: true
          }]
        })
        .mockResolvedValueOnce({
          rows: [{ count: '1' }]
        })

      const result = await checkSlotAvailability(
        mockClient,
        1,
        '2025-10-20T10:00:00Z',
        '2025-10-20T11:00:00Z'
      )

      expect(result).toEqual({
        available: true,
        currentCount: 1,
        maxCapacity: 3,
        slotsRemaining: 2
      })
    })

    it('should return available=false when at capacity', async () => {
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            simultaneous_capacity: 2,
            capacity_enabled: true
          }]
        })
        .mockResolvedValueOnce({
          rows: [{ count: '2' }]
        })

      const result = await checkSlotAvailability(
        mockClient,
        1,
        '2025-10-20T10:00:00Z',
        '2025-10-20T11:00:00Z'
      )

      expect(result).toEqual({
        available: false,
        currentCount: 2,
        maxCapacity: 2,
        slotsRemaining: 0
      })
    })

    it('should work with capacity disabled (max=1)', async () => {
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            simultaneous_capacity: 5,
            capacity_enabled: false
          }]
        })
        .mockResolvedValueOnce({
          rows: [{ count: '0' }]
        })

      const result = await checkSlotAvailability(
        mockClient,
        1,
        '2025-10-20T10:00:00Z',
        '2025-10-20T11:00:00Z'
      )

      expect(result).toEqual({
        available: true,
        currentCount: 0,
        maxCapacity: 1,
        slotsRemaining: 1
      })
    })

    it('should return unavailable with capacity disabled and 1 booking', async () => {
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            simultaneous_capacity: 10,
            capacity_enabled: false
          }]
        })
        .mockResolvedValueOnce({
          rows: [{ count: '1' }]
        })

      const result = await checkSlotAvailability(
        mockClient,
        1,
        '2025-10-20T10:00:00Z',
        '2025-10-20T11:00:00Z'
      )

      expect(result).toEqual({
        available: false,
        currentCount: 1,
        maxCapacity: 1,
        slotsRemaining: 0
      })
    })
  })
})
