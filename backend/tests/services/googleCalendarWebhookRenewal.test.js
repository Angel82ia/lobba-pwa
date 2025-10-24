import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import pool from '../../src/config/database.js'
import * as googleCalendarService from '../../src/services/googleCalendarService.js'
import logger from '../../src/utils/logger.js'
import {
  renewExpiringWebhooks,
  cleanupExpiredWebhooks,
} from '../../src/services/googleCalendarWebhookRenewal.js'

vi.mock('../../src/config/database.js')
vi.mock('../../src/services/googleCalendarService.js')
vi.mock('../../src/utils/logger.js')

describe('googleCalendarWebhookRenewal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('renewExpiringWebhooks', () => {
    it('should renew webhooks expiring in less than 2 days', async () => {
      // Mock salones con webhooks por expirar
      const expiringSoon = new Date()
      expiringSoon.setHours(expiringSoon.getHours() + 24) // Expira en 24 horas

      pool.query = vi.fn().mockImplementation(query => {
        if (query.includes('google_webhook_expiration < NOW()')) {
          return Promise.resolve({
            rows: [
              {
                id: 1,
                business_name: 'Salon Test',
                google_webhook_channel_id: 'channel-123',
                google_webhook_expiration: expiringSoon,
              },
            ],
          })
        }
        return Promise.resolve({ rows: [] })
      })

      vi.spyOn(googleCalendarService, 'setupWebhook').mockResolvedValue({
        id: 'new-channel-456',
        resourceId: 'resource-789',
        expiration: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días
      })

      const result = await renewExpiringWebhooks()

      expect(result.renewed).toBe(1)
      expect(result.failed).toBe(0)
      expect(googleCalendarService.setupWebhook).toHaveBeenCalledTimes(1)
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Successfully renewed webhook for salon'),
        expect.objectContaining({
          salonId: 1,
          salonName: 'Salon Test',
        })
      )
    })

    it('should handle renewal failures and create notifications', async () => {
      const expiringSoon = new Date()
      expiringSoon.setHours(expiringSoon.getHours() + 12)

      pool.query = vi.fn().mockImplementation(query => {
        if (query.includes('google_webhook_expiration < NOW()')) {
          return Promise.resolve({
            rows: [
              {
                id: 2,
                business_name: 'Salon Error',
                google_webhook_channel_id: 'channel-error',
                google_webhook_expiration: expiringSoon,
              },
            ],
          })
        }
        if (query.includes('INSERT INTO notifications')) {
          return Promise.resolve({ rows: [] })
        }
        return Promise.resolve({ rows: [] })
      })

      vi.spyOn(googleCalendarService, 'setupWebhook').mockRejectedValue(
        new Error('Google API error')
      )

      const result = await renewExpiringWebhooks()

      expect(result.renewed).toBe(0)
      expect(result.failed).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toBe('Google API error')
      expect(logger.error).toHaveBeenCalled()
    })

    it('should skip renewal when no webhooks are expiring', async () => {
      pool.query = vi.fn().mockResolvedValue({ rows: [] })

      const result = await renewExpiringWebhooks()

      expect(result.renewed).toBe(0)
      expect(result.failed).toBe(0)
      expect(googleCalendarService.setupWebhook).not.toHaveBeenCalled()
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('No webhooks need renewal'))
    })
  })

  describe('cleanupExpiredWebhooks', () => {
    it('should cleanup webhooks expired for more than 1 day', async () => {
      pool.query = vi.fn().mockImplementation(query => {
        if (query.includes('UPDATE salon_profiles')) {
          return Promise.resolve({
            rows: [
              { id: 3, business_name: 'Expired Salon' },
              { id: 4, business_name: 'Another Expired' },
            ],
          })
        }
        if (query.includes('INSERT INTO notifications')) {
          return Promise.resolve({ rows: [] })
        }
        return Promise.resolve({ rows: [] })
      })

      const result = await cleanupExpiredWebhooks()

      expect(result.cleaned).toBe(2)
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up 2 expired webhooks'),
        expect.objectContaining({
          salons: expect.arrayContaining([
            expect.objectContaining({ id: 3, name: 'Expired Salon' }),
            expect.objectContaining({ id: 4, name: 'Another Expired' }),
          ]),
        })
      )
    })

    it('should skip cleanup when no expired webhooks exist', async () => {
      pool.query = vi.fn().mockResolvedValue({ rows: [] })

      const result = await cleanupExpiredWebhooks()

      expect(result.cleaned).toBe(0)
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('No expired webhooks to clean')
      )
    })
  })
})
