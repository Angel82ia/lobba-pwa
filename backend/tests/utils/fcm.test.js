import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { initializeFirebase, sendPushNotification, resetFirebase } from '../../src/utils/fcm.js'

const mockSendMulticast = vi.fn()
const mockMessaging = {
  sendMulticast: mockSendMulticast,
}

vi.mock('firebase-admin', () => ({
  default: {
    initializeApp: vi.fn(() => ({ name: 'test-app' })),
    credential: {
      cert: vi.fn((config) => config),
    },
    messaging: vi.fn(() => mockMessaging),
  },
}))

const admin = (await import('firebase-admin')).default

describe('FCM Utils', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    mockSendMulticast.mockClear()
    resetFirebase()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('initializeFirebase', () => {
    it('should initialize Firebase with valid credentials', () => {
      process.env.FCM_PROJECT_ID = 'test-project'
      process.env.FCM_SERVER_KEY = 'test-key\\nwith\\nnewlines'

      const app = initializeFirebase()

      expect(admin.initializeApp).toHaveBeenCalled()
      expect(app).toBeDefined()
    })

    it('should return null if credentials are missing', () => {
      delete process.env.FCM_PROJECT_ID
      delete process.env.FCM_SERVER_KEY
      
      const app = initializeFirebase()

      expect(app).toBeNull()
    })

    it('should return existing app if already initialized', () => {
      process.env.FCM_PROJECT_ID = 'test-project'
      process.env.FCM_SERVER_KEY = 'test-key'

      const app1 = initializeFirebase()
      const app2 = initializeFirebase()

      expect(app1).toBe(app2)
    })
  })

  describe('sendPushNotification', () => {
    beforeEach(() => {
      process.env.FCM_PROJECT_ID = 'test-project'
      process.env.FCM_SERVER_KEY = 'test-key'
    })

    it('should send push notification successfully', async () => {
      const mockResponse = {
        successCount: 2,
        failureCount: 0,
        responses: [],
      }
      mockSendMulticast.mockResolvedValueOnce(mockResponse)

      const result = await sendPushNotification(
        ['token-1', 'token-2'],
        {
          title: 'Test Title',
          body: 'Test Body',
          data: { key: 'value' },
        }
      )

      expect(result).toEqual({
        success: true,
        successCount: 2,
        failureCount: 0,
        responses: [],
      })
    })

    it('should handle single token as string', async () => {
      const mockResponse = {
        successCount: 1,
        failureCount: 0,
        responses: [],
      }
      mockSendMulticast.mockResolvedValueOnce(mockResponse)

      const result = await sendPushNotification(
        'single-token',
        {
          title: 'Test Title',
          body: 'Test Body',
        }
      )

      expect(result.success).toBe(true)
      expect(result.successCount).toBe(1)
    })

    it('should return error if no tokens provided', async () => {
      const result = await sendPushNotification([], {
        title: 'Test',
        body: 'Test',
      })

      expect(result).toEqual({
        success: false,
        error: 'No Firebase app or tokens',
      })
    })

    it('should handle FCM send errors', async () => {
      mockSendMulticast.mockRejectedValueOnce(new Error('FCM Error'))

      const result = await sendPushNotification(
        ['token-1'],
        {
          title: 'Test',
          body: 'Test',
        }
      )

      expect(result).toEqual({
        success: false,
        error: 'FCM Error',
      })
    })
  })
})
