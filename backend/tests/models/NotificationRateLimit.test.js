import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as NotificationRateLimit from '../../src/models/NotificationRateLimit.js'

vi.mock('../../src/config/database.js', () => ({
  default: {
    query: vi.fn(),
  },
}))

const pool = (await import('../../src/config/database.js')).default

describe('NotificationRateLimit Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkRateLimit', () => {
    it('should return allowed=true when no record exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] })

      const result = await NotificationRateLimit.checkRateLimit('salon-1')

      expect(result).toEqual({
        allowed: true,
        count: 0,
        limit: 10,
      })
    })

    it('should return allowed=true when count is below limit', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ salon_profile_id: 'salon-1', count: 5 }],
      })

      const result = await NotificationRateLimit.checkRateLimit('salon-1')

      expect(result).toEqual({
        allowed: true,
        count: 5,
        limit: 10,
      })
    })

    it('should return allowed=false when limit is reached', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ salon_profile_id: 'salon-1', count: 10 }],
      })

      const result = await NotificationRateLimit.checkRateLimit('salon-1')

      expect(result).toEqual({
        allowed: false,
        count: 10,
        limit: 10,
      })
    })

    it('should return allowed=false when count exceeds limit', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ salon_profile_id: 'salon-1', count: 15 }],
      })

      const result = await NotificationRateLimit.checkRateLimit('salon-1')

      expect(result).toEqual({
        allowed: false,
        count: 15,
        limit: 10,
      })
    })
  })

  describe('incrementRateLimit', () => {
    it('should create new record on first notification', async () => {
      const mockRecord = {
        salon_profile_id: 'salon-1',
        date: '2025-10-03',
        count: 1,
      }
      pool.query.mockResolvedValueOnce({ rows: [mockRecord] })

      const result = await NotificationRateLimit.incrementRateLimit('salon-1')

      expect(pool.query).toHaveBeenCalled()
      expect(result.count).toBe(1)
    })

    it('should increment existing record', async () => {
      const mockRecord = {
        salon_profile_id: 'salon-1',
        date: '2025-10-03',
        count: 6,
      }
      pool.query.mockResolvedValueOnce({ rows: [mockRecord] })

      const result = await NotificationRateLimit.incrementRateLimit('salon-1')

      expect(pool.query).toHaveBeenCalled()
      expect(result.count).toBeGreaterThan(0)
    })
  })

  describe('getRateLimitStats', () => {
    it('should return stats for last 30 days', async () => {
      const mockStats = [
        { date: '2025-10-03', count: 5 },
        { date: '2025-10-02', count: 8 },
        { date: '2025-10-01', count: 3 },
      ]
      pool.query.mockResolvedValueOnce({ rows: mockStats })

      const result = await NotificationRateLimit.getRateLimitStats('salon-1', 30)

      expect(pool.query).toHaveBeenCalled()
      expect(result).toEqual(mockStats)
    })
  })
})
