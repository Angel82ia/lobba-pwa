import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as NotificationPreference from '../../src/models/NotificationPreference.js'

vi.mock('../../src/config/database.js', () => ({
  default: {
    query: vi.fn(),
  },
}))

const pool = (await import('../../src/config/database.js')).default

describe('NotificationPreference Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findPreferenceByUserId', () => {
    it('should find preference by user ID', async () => {
      const mockPreference = {
        id: '123',
        user_id: 'user-1',
        notifications_enabled: true,
        types_enabled: ['oferta', 'evento'],
        max_radius_km: 30,
      }
      pool.query.mockResolvedValueOnce({ rows: [mockPreference] })

      const result = await NotificationPreference.findPreferenceByUserId('user-1')

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM user_notification_preferences WHERE user_id = $1',
        ['user-1']
      )
      expect(result).toEqual(mockPreference)
    })

    it('should return undefined if preference not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] })

      const result = await NotificationPreference.findPreferenceByUserId('user-1')

      expect(result).toBeUndefined()
    })
  })

  describe('createPreference', () => {
    it('should create a new notification preference', async () => {
      const mockPreference = {
        id: '123',
        user_id: 'user-1',
        notifications_enabled: true,
        types_enabled: ['oferta', 'evento'],
        max_radius_km: 50,
      }
      pool.query.mockResolvedValueOnce({ rows: [mockPreference] })

      const result = await NotificationPreference.createPreference({
        userId: 'user-1',
        notificationsEnabled: true,
        typesEnabled: ['oferta', 'evento'],
        maxRadiusKm: 50,
      })

      expect(pool.query).toHaveBeenCalled()
      expect(result).toEqual(mockPreference)
    })
  })

  describe('updatePreference', () => {
    it('should update notification preferences', async () => {
      const mockUpdated = {
        id: '123',
        user_id: 'user-1',
        notifications_enabled: false,
        types_enabled: ['oferta'],
        max_radius_km: 20,
      }
      pool.query.mockResolvedValueOnce({ rows: [mockUpdated] })

      const result = await NotificationPreference.updatePreference('user-1', {
        notificationsEnabled: false,
        maxRadiusKm: 20,
      })

      expect(pool.query).toHaveBeenCalled()
      expect(result).toEqual(mockUpdated)
    })

    it('should return existing preference if no updates provided', async () => {
      const mockPreference = {
        id: '123',
        user_id: 'user-1',
        notifications_enabled: true,
        types_enabled: ['oferta'],
        max_radius_km: 50,
      }
      pool.query.mockResolvedValueOnce({ rows: [mockPreference] })

      const result = await NotificationPreference.updatePreference('user-1', {})

      expect(result).toEqual(mockPreference)
    })
  })

  describe('getOrCreatePreference', () => {
    it('should return existing preference if found', async () => {
      const mockPreference = {
        id: '123',
        user_id: 'user-1',
        notifications_enabled: true,
      }
      pool.query.mockResolvedValueOnce({ rows: [mockPreference] })

      const result = await NotificationPreference.getOrCreatePreference('user-1')

      expect(result).toEqual(mockPreference)
    })

    it('should create new preference if not found', async () => {
      const mockNewPreference = {
        id: '123',
        user_id: 'user-1',
        notifications_enabled: true,
        types_enabled: ['oferta', 'evento', 'descuento', 'noticia'],
        max_radius_km: 50,
      }
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockNewPreference] })

      const result = await NotificationPreference.getOrCreatePreference('user-1')

      expect(pool.query).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockNewPreference)
    })
  })
})
