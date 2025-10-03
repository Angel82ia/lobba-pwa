import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as notificationController from '../../src/controllers/notificationController.js'
import * as NotificationPreference from '../../src/models/NotificationPreference.js'
import * as FCMToken from '../../src/models/FCMToken.js'
import * as Notification from '../../src/models/Notification.js'
import * as NotificationRateLimit from '../../src/models/NotificationRateLimit.js'
import * as SalonProfile from '../../src/models/SalonProfile.js'
import * as fcm from '../../src/utils/fcm.js'

vi.mock('../../src/models/NotificationPreference.js')
vi.mock('../../src/models/FCMToken.js')
vi.mock('../../src/models/Notification.js')
vi.mock('../../src/models/NotificationRateLimit.js')
vi.mock('../../src/models/SalonProfile.js')
vi.mock('../../src/utils/fcm.js')

describe('NotificationController', () => {
  let req, res

  beforeEach(() => {
    req = {
      user: { id: 'user-1' },
      body: {},
      query: {},
    }
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    }
    vi.clearAllMocks()
  })

  describe('registerFCMToken', () => {
    it('should register FCM token successfully', async () => {
      req.body = { token: 'fcm-token-123', deviceType: 'android' }
      const mockToken = { id: '123', token: 'fcm-token-123' }
      FCMToken.registerToken.mockResolvedValueOnce(mockToken)

      await notificationController.registerFCMToken(req, res)

      expect(FCMToken.registerToken).toHaveBeenCalledWith({
        userId: 'user-1',
        token: 'fcm-token-123',
        deviceType: 'android',
      })
      expect(res.json).toHaveBeenCalledWith(mockToken)
    })

    it('should return 400 if token is missing', async () => {
      req.body = {}

      await notificationController.registerFCMToken(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalled()
    })
  })

  describe('getNotificationPreferences', () => {
    it('should get or create preferences for user', async () => {
      const mockPreference = {
        id: '123',
        user_id: 'user-1',
        notifications_enabled: true,
      }
      NotificationPreference.getOrCreatePreference.mockResolvedValueOnce(mockPreference)

      await notificationController.getNotificationPreferences(req, res)

      expect(NotificationPreference.getOrCreatePreference).toHaveBeenCalledWith('user-1')
      expect(res.json).toHaveBeenCalledWith(mockPreference)
    })
  })

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences', async () => {
      req.body = { notificationsEnabled: false, maxRadiusKm: 20 }
      const mockUpdated = {
        id: '123',
        notifications_enabled: false,
        max_radius_km: 20,
      }
      NotificationPreference.updatePreference.mockResolvedValueOnce(mockUpdated)

      await notificationController.updateNotificationPreferences(req, res)

      expect(NotificationPreference.updatePreference).toHaveBeenCalledWith('user-1', req.body)
      expect(res.json).toHaveBeenCalledWith(mockUpdated)
    })
  })

  describe('sendNotification', () => {
    beforeEach(() => {
      req.body = {
        title: 'Test Notification',
        body: 'Test body',
        type: 'oferta',
        targetingType: 'geographic',
        radiusKm: 10,
      }
    })

    it('should return 400 if required fields are missing', async () => {
      req.body = { title: 'Test' }

      await notificationController.sendNotification(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalled()
    })

    it('should return 400 if notification type is invalid', async () => {
      req.body.type = 'invalid_type'

      await notificationController.sendNotification(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid notification type' })
    })

    it('should return 404 if salon profile not found', async () => {
      SalonProfile.findSalonProfileByUserId.mockResolvedValueOnce(null)

      await notificationController.sendNotification(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Salon profile not found' })
    })

    it('should return 429 if rate limit exceeded', async () => {
      const mockSalon = { id: 'salon-1', latitude: 40.4168, longitude: -3.7038 }
      SalonProfile.findSalonProfileByUserId.mockResolvedValueOnce(mockSalon)
      NotificationRateLimit.checkRateLimit.mockResolvedValueOnce({
        allowed: false,
        count: 10,
        limit: 10,
      })

      await notificationController.sendNotification(req, res)

      expect(res.status).toHaveBeenCalledWith(429)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Daily notification limit reached (10/day)',
        count: 10,
        limit: 10,
      })
    })

    it('should send notification successfully to geographic area', async () => {
      const mockSalon = { id: 'salon-1', latitude: 40.4168, longitude: -3.7038 }
      const mockUsers = [{ id: 'user-1' }, { id: 'user-2' }]
      const mockTokens = [
        { token: 'token-1' },
        { token: 'token-2' },
      ]
      const mockNotification = { id: 'notif-1' }
      const mockUpdatedNotification = { id: 'notif-1', status: 'sent', success_count: 2 }

      SalonProfile.findSalonProfileByUserId.mockResolvedValueOnce(mockSalon)
      NotificationRateLimit.checkRateLimit.mockResolvedValueOnce({ allowed: true })
      Notification.createNotification.mockResolvedValueOnce(mockNotification)
      SalonProfile.getUsersInRadius.mockResolvedValueOnce(mockUsers)
      FCMToken.findTokensByUserIds.mockResolvedValueOnce(mockTokens)
      NotificationRateLimit.incrementRateLimit.mockResolvedValueOnce({})
      Notification.updateNotificationStatus.mockResolvedValueOnce({})
      Notification.updateNotificationStatus.mockResolvedValueOnce(mockUpdatedNotification)
      fcm.sendPushNotification.mockResolvedValueOnce({
        success: true,
        successCount: 2,
        failureCount: 0,
      })

      await notificationController.sendNotification(req, res)

      expect(fcm.sendPushNotification).toHaveBeenCalledWith(
        ['token-1', 'token-2'],
        expect.objectContaining({
          title: 'Test Notification',
          body: 'Test body',
        })
      )
      expect(res.json).toHaveBeenCalledWith(mockUpdatedNotification)
    })

    it('should handle case with no users in target area', async () => {
      const mockSalon = { id: 'salon-1', latitude: 40.4168, longitude: -3.7038 }
      const mockNotification = { id: 'notif-1' }

      SalonProfile.findSalonProfileByUserId.mockResolvedValueOnce(mockSalon)
      NotificationRateLimit.checkRateLimit.mockResolvedValueOnce({ allowed: true })
      Notification.createNotification.mockResolvedValueOnce(mockNotification)
      SalonProfile.getUsersInRadius.mockResolvedValueOnce([])
      NotificationRateLimit.incrementRateLimit.mockResolvedValueOnce({})
      Notification.updateNotificationStatus.mockResolvedValueOnce(mockNotification)

      await notificationController.sendNotification(req, res)

      expect(fcm.sendPushNotification).not.toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No users found in target area',
        })
      )
    })
  })

  describe('getNotificationHistory', () => {
    it('should get notification history for salon', async () => {
      const mockSalon = { id: 'salon-1' }
      const mockNotifications = [
        { id: '1', title: 'Notif 1' },
        { id: '2', title: 'Notif 2' },
      ]

      SalonProfile.findSalonProfileByUserId.mockResolvedValueOnce(mockSalon)
      Notification.findNotificationsBySalonId.mockResolvedValueOnce(mockNotifications)

      await notificationController.getNotificationHistory(req, res)

      expect(Notification.findNotificationsBySalonId).toHaveBeenCalledWith('salon-1', {
        page: 1,
        limit: 20,
      })
      expect(res.json).toHaveBeenCalledWith(mockNotifications)
    })
  })

  describe('getAllNotifications', () => {
    it('should get all notifications (admin)', async () => {
      const mockNotifications = [
        { id: '1', title: 'Notif 1' },
        { id: '2', title: 'Notif 2' },
      ]

      Notification.findAllNotifications.mockResolvedValueOnce(mockNotifications)

      await notificationController.getAllNotifications(req, res)

      expect(Notification.findAllNotifications).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
      })
      expect(res.json).toHaveBeenCalledWith(mockNotifications)
    })
  })
})
