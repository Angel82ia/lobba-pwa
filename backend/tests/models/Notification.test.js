import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as Notification from '../../src/models/Notification.js'

vi.mock('../../src/config/database.js', () => ({
  default: {
    query: vi.fn(),
  },
}))

const pool = (await import('../../src/config/database.js')).default

describe('Notification Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createNotification', () => {
    it('should create a notification without location', async () => {
      const mockNotification = {
        id: '123',
        salon_profile_id: 'salon-1',
        title: 'Oferta Especial',
        body: 'Descuento del 20%',
        type: 'oferta',
        targeting_type: 'own_clients',
        status: 'pending',
      }
      pool.query.mockResolvedValueOnce({ rows: [mockNotification] })

      const result = await Notification.createNotification({
        salonProfileId: 'salon-1',
        title: 'Oferta Especial',
        body: 'Descuento del 20%',
        type: 'oferta',
        targetingType: 'own_clients',
      })

      expect(pool.query).toHaveBeenCalled()
      expect(result).toEqual(mockNotification)
    })

    it('should create a notification with geographic location', async () => {
      const mockNotification = {
        id: '123',
        salon_profile_id: 'salon-1',
        title: 'Evento Cercano',
        body: 'Nuevo evento en tu área',
        type: 'evento',
        targeting_type: 'geographic',
        radius_km: 10,
      }
      pool.query.mockResolvedValueOnce({ rows: [mockNotification] })

      const result = await Notification.createNotification({
        salonProfileId: 'salon-1',
        title: 'Evento Cercano',
        body: 'Nuevo evento en tu área',
        type: 'evento',
        targetingType: 'geographic',
        radiusKm: 10,
        centerLocation: { latitude: 40.4168, longitude: -3.7038 },
      })

      expect(pool.query).toHaveBeenCalled()
      expect(result).toEqual(mockNotification)
    })
  })

  describe('findNotificationById', () => {
    it('should find notification by ID', async () => {
      const mockNotification = {
        id: '123',
        title: 'Test',
        latitude: 40.4168,
        longitude: -3.7038,
      }
      pool.query.mockResolvedValueOnce({ rows: [mockNotification] })

      const result = await Notification.findNotificationById('123')

      expect(pool.query).toHaveBeenCalled()
      expect(result).toEqual(mockNotification)
    })
  })

  describe('findNotificationsBySalonId', () => {
    it('should find notifications for a salon with pagination', async () => {
      const mockNotifications = [
        { id: '1', title: 'Notification 1' },
        { id: '2', title: 'Notification 2' },
      ]
      pool.query.mockResolvedValueOnce({ rows: mockNotifications })

      const result = await Notification.findNotificationsBySalonId('salon-1', {
        page: 1,
        limit: 20,
      })

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['salon-1', 20, 0]
      )
      expect(result).toEqual(mockNotifications)
    })
  })

  describe('findAllNotifications', () => {
    it('should find all notifications with pagination', async () => {
      const mockNotifications = [
        { id: '1', title: 'Notification 1', salon_name: 'Salon A' },
        { id: '2', title: 'Notification 2', salon_name: 'Salon B' },
      ]
      pool.query.mockResolvedValueOnce({ rows: mockNotifications })

      const result = await Notification.findAllNotifications({
        page: 1,
        limit: 50,
      })

      expect(pool.query).toHaveBeenCalled()
      expect(result).toEqual(mockNotifications)
    })
  })

  describe('updateNotificationStatus', () => {
    it('should update notification status with counts', async () => {
      const mockUpdated = {
        id: '123',
        status: 'sent',
        sent_count: 100,
        success_count: 95,
        failure_count: 5,
      }
      pool.query.mockResolvedValueOnce({ rows: [mockUpdated] })

      const result = await Notification.updateNotificationStatus('123', 'sent', {
        sentCount: 100,
        successCount: 95,
        failureCount: 5,
      })

      expect(pool.query).toHaveBeenCalled()
      expect(result).toEqual(mockUpdated)
    })

    it('should set sent_at when status is sent', async () => {
      const mockUpdated = {
        id: '123',
        status: 'sent',
        sent_at: expect.any(String),
      }
      pool.query.mockResolvedValueOnce({ rows: [mockUpdated] })

      const result = await Notification.updateNotificationStatus('123', 'sent')

      expect(pool.query).toHaveBeenCalled()
      expect(result.status).toBe('sent')
    })
  })
})
