import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as notificationService from './notification'
import apiClient from './api'

vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}))

describe('Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registerFCMToken', () => {
    it('should register FCM token', async () => {
      const mockResponse = { data: { id: '123', token: 'fcm-token' } }
      apiClient.post.mockResolvedValueOnce(mockResponse)

      const result = await notificationService.registerFCMToken('fcm-token', 'android')

      expect(apiClient.post).toHaveBeenCalledWith('/notifications/register-token', {
        token: 'fcm-token',
        deviceType: 'android',
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('getNotificationPreferences', () => {
    it('should get notification preferences', async () => {
      const mockPreferences = {
        notifications_enabled: true,
        types_enabled: ['oferta', 'evento'],
        max_radius_km: 50,
      }
      apiClient.get.mockResolvedValueOnce({ data: mockPreferences })

      const result = await notificationService.getNotificationPreferences()

      expect(apiClient.get).toHaveBeenCalledWith('/notifications/preferences')
      expect(result).toEqual(mockPreferences)
    })
  })

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences', async () => {
      const updates = { notificationsEnabled: false }
      const mockUpdated = { notifications_enabled: false }
      apiClient.put.mockResolvedValueOnce({ data: mockUpdated })

      const result = await notificationService.updateNotificationPreferences(updates)

      expect(apiClient.put).toHaveBeenCalledWith('/notifications/preferences', updates)
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('sendNotification', () => {
    it('should send notification', async () => {
      const notificationData = {
        title: 'Test',
        body: 'Test body',
        type: 'oferta',
        targetingType: 'geographic',
        radiusKm: 10,
      }
      const mockSent = { id: '123', ...notificationData }
      apiClient.post.mockResolvedValueOnce({ data: mockSent })

      const result = await notificationService.sendNotification(notificationData)

      expect(apiClient.post).toHaveBeenCalledWith('/notifications/send', notificationData)
      expect(result).toEqual(mockSent)
    })
  })

  describe('getNotificationHistory', () => {
    it('should get notification history', async () => {
      const mockHistory = [
        { id: '1', title: 'Notif 1' },
        { id: '2', title: 'Notif 2' },
      ]
      apiClient.get.mockResolvedValueOnce({ data: mockHistory })

      const result = await notificationService.getNotificationHistory(1, 20)

      expect(apiClient.get).toHaveBeenCalledWith('/notifications/history', {
        params: { page: 1, limit: 20 },
      })
      expect(result).toEqual(mockHistory)
    })
  })

  describe('getAllNotifications', () => {
    it('should get all notifications for admin', async () => {
      const mockAll = [
        { id: '1', title: 'Notif 1' },
        { id: '2', title: 'Notif 2' },
      ]
      apiClient.get.mockResolvedValueOnce({ data: mockAll })

      const result = await notificationService.getAllNotifications(1, 50)

      expect(apiClient.get).toHaveBeenCalledWith('/notifications/all', {
        params: { page: 1, limit: 50 },
      })
      expect(result).toEqual(mockAll)
    })
  })

  describe('requestNotificationPermission', () => {
    it('should request notification permission', async () => {
      global.Notification = {
        requestPermission: vi.fn().mockResolvedValueOnce('granted'),
      }

      const result = await notificationService.requestNotificationPermission()

      expect(result).toEqual({ granted: true, permission: 'granted' })
    })

    it('should return error if notifications not supported', async () => {
      delete global.Notification

      const result = await notificationService.requestNotificationPermission()

      expect(result).toEqual({
        granted: false,
        error: 'Notifications not supported',
      })
    })
  })
})
