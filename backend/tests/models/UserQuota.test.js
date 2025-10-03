import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as UserQuota from '../../src/models/UserQuota.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js')

describe('UserQuota Model', () => {
  const mockUserId = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findQuotaByUserId', () => {
    it('should find quota by user ID', async () => {
      const mockQuota = {
        id: 'quota-1',
        user_id: mockUserId,
        nails_quota_used: 10,
        nails_quota_limit: 100,
        hairstyle_quota_used: 2,
        hairstyle_quota_limit: 4
      }

      pool.query.mockResolvedValue({ rows: [mockQuota] })

      const result = await UserQuota.findQuotaByUserId(mockUserId)

      expect(result).toEqual(mockQuota)
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM user_quotas WHERE user_id = $1',
        [mockUserId]
      )
    })
  })

  describe('createQuota', () => {
    it('should create new quota with default values', async () => {
      const mockQuota = {
        id: 'quota-1',
        user_id: mockUserId,
        nails_quota_used: 0,
        nails_quota_limit: 100,
        hairstyle_quota_used: 0,
        hairstyle_quota_limit: 4
      }

      pool.query.mockResolvedValue({ rows: [mockQuota] })

      const result = await UserQuota.createQuota(mockUserId)

      expect(result).toEqual(mockQuota)
    })
  })

  describe('checkNailsQuota', () => {
    it('should return quota status with remaining quota', async () => {
      const mockQuota = {
        nails_quota_used: 50,
        nails_quota_limit: 100
      }

      pool.query.mockResolvedValue({ rows: [mockQuota] })

      const result = await UserQuota.checkNailsQuota(mockUserId)

      expect(result).toEqual({
        hasQuota: true,
        used: 50,
        limit: 100,
        remaining: 50
      })
    })

    it('should return no quota when limit reached', async () => {
      const mockQuota = {
        nails_quota_used: 100,
        nails_quota_limit: 100
      }

      pool.query.mockResolvedValue({ rows: [mockQuota] })

      const result = await UserQuota.checkNailsQuota(mockUserId)

      expect(result).toEqual({
        hasQuota: false,
        used: 100,
        limit: 100,
        remaining: 0
      })
    })
  })

  describe('incrementNailsQuota', () => {
    it('should increment nails quota used', async () => {
      const mockQuota = {
        nails_quota_used: 51,
        nails_quota_limit: 100
      }

      pool.query.mockResolvedValue({ rows: [mockQuota] })

      const result = await UserQuota.incrementNailsQuota(mockUserId)

      expect(result.nails_quota_used).toBe(51)
    })
  })
})
