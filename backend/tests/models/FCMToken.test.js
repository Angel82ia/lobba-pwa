import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as FCMToken from '../../src/models/FCMToken.js'

vi.mock('../../src/config/database.js', () => ({
  default: {
    query: vi.fn(),
  },
}))

const pool = (await import('../../src/config/database.js')).default

describe('FCMToken Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registerToken', () => {
    it('should register a new FCM token', async () => {
      const mockToken = {
        id: '123',
        user_id: 'user-1',
        token: 'fcm-token-123',
        device_type: 'android',
        is_active: true,
      }
      pool.query.mockResolvedValueOnce({ rows: [mockToken] })

      const result = await FCMToken.registerToken({
        userId: 'user-1',
        token: 'fcm-token-123',
        deviceType: 'android',
      })

      expect(pool.query).toHaveBeenCalled()
      expect(result).toEqual(mockToken)
    })

    it('should update existing token on conflict', async () => {
      const mockToken = {
        id: '123',
        user_id: 'user-2',
        token: 'fcm-token-123',
        device_type: 'ios',
        is_active: true,
      }
      pool.query.mockResolvedValueOnce({ rows: [mockToken] })

      const result = await FCMToken.registerToken({
        userId: 'user-2',
        token: 'fcm-token-123',
        deviceType: 'ios',
      })

      expect(result.user_id).toBe('user-2')
    })
  })

  describe('findTokensByUserId', () => {
    it('should find all active tokens for a user', async () => {
      const mockTokens = [
        { id: '1', user_id: 'user-1', token: 'token-1', is_active: true },
        { id: '2', user_id: 'user-1', token: 'token-2', is_active: true },
      ]
      pool.query.mockResolvedValueOnce({ rows: mockTokens })

      const result = await FCMToken.findTokensByUserId('user-1')

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM fcm_tokens WHERE user_id = $1 AND is_active = true',
        ['user-1']
      )
      expect(result).toEqual(mockTokens)
    })
  })

  describe('deactivateToken', () => {
    it('should deactivate a token', async () => {
      const mockToken = {
        id: '123',
        token: 'fcm-token-123',
        is_active: false,
      }
      pool.query.mockResolvedValueOnce({ rows: [mockToken] })

      const result = await FCMToken.deactivateToken('fcm-token-123')

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE fcm_tokens SET is_active = false WHERE token = $1 RETURNING *',
        ['fcm-token-123']
      )
      expect(result).toEqual(mockToken)
    })
  })

  describe('findTokensByUserIds', () => {
    it('should find tokens for multiple users', async () => {
      const mockTokens = [
        { id: '1', user_id: 'user-1', token: 'token-1' },
        { id: '2', user_id: 'user-2', token: 'token-2' },
      ]
      pool.query.mockResolvedValueOnce({ rows: mockTokens })

      const result = await FCMToken.findTokensByUserIds(['user-1', 'user-2'])

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM fcm_tokens WHERE user_id = ANY($1) AND is_active = true',
        [['user-1', 'user-2']]
      )
      expect(result).toEqual(mockTokens)
    })
  })

  describe('updateLastUsed', () => {
    it('should update last_used_at timestamp', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] })

      await FCMToken.updateLastUsed('fcm-token-123')

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE fcm_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE token = $1',
        ['fcm-token-123']
      )
    })
  })

  describe('cleanupInactiveTokens', () => {
    it('should delete tokens inactive for 90 days', async () => {
      const mockDeleted = [
        { id: '1', token: 'old-token-1' },
        { id: '2', token: 'old-token-2' },
      ]
      pool.query.mockResolvedValueOnce({ rows: mockDeleted })

      const result = await FCMToken.cleanupInactiveTokens(90)

      expect(pool.query).toHaveBeenCalled()
      expect(result).toEqual(mockDeleted)
    })
  })
})
