import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { body } from 'express-validator'
import * as deviceProfileController from '../../src/controllers/deviceProfileController.js'
import * as DeviceProfile from '../../src/models/DeviceProfile.js'

vi.mock('../../src/models/DeviceProfile.js')

const app = express()
app.use(express.json())

const mockDeviceAuth = (req, res, next) => {
  req.user = { id: 'device-user-123', role: 'device' }
  next()
}

const mockAdminAuth = (req, res, next) => {
  req.user = { id: 'admin-123', role: 'admin' }
  next()
}

app.get('/device/:id', deviceProfileController.getDeviceProfile)
app.post(
  '/device',
  mockDeviceAuth,
  [
    body('deviceId').trim().isLength({ min: 1 }),
    body('deviceName').trim().isLength({ min: 1 }),
    body('deviceType').optional().trim(),
  ],
  deviceProfileController.createDeviceProfile
)
app.put(
  '/device/:id',
  mockDeviceAuth,
  [
    body('deviceName').optional().trim().isLength({ min: 1 }),
  ],
  deviceProfileController.updateDeviceProfile
)
app.delete('/device/:id', mockDeviceAuth, deviceProfileController.deleteDeviceProfile)
app.put(
  '/device/:id/capabilities',
  mockDeviceAuth,
  [body('capabilities').isArray()],
  deviceProfileController.updateCapabilities
)
app.put(
  '/device/:id/location',
  mockDeviceAuth,
  [
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
  ],
  deviceProfileController.updateLocation
)

describe('DeviceProfileController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /device/:id', () => {
    it('should get device profile by ID', async () => {
      const mockProfile = {
        id: 'device-profile-123',
        user_id: 'device-user-123',
        device_id: 'KIOSK-001',
        device_name: 'Main Kiosk',
        device_type: 'kiosk',
        capabilities: ['dispense', 'pickup'],
        latitude: 40.4168,
        longitude: -3.7038,
        is_active: true,
        last_ping: '2024-01-01T00:00:00.000Z',
      }

      DeviceProfile.findDeviceProfileById.mockResolvedValue(mockProfile)

      const response = await request(app).get('/device/device-profile-123')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        id: 'device-profile-123',
        userId: 'device-user-123',
        deviceId: 'KIOSK-001',
        deviceName: 'Main Kiosk',
        deviceType: 'kiosk',
        capabilities: ['dispense', 'pickup'],
        location: { latitude: 40.4168, longitude: -3.7038 },
        isActive: true,
        lastPing: '2024-01-01T00:00:00.000Z',
      })
    })

    it('should return 404 if device profile not found', async () => {
      DeviceProfile.findDeviceProfileById.mockResolvedValue(null)

      const response = await request(app).get('/device/non-existent')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Device profile not found')
    })

    it('should handle errors', async () => {
      DeviceProfile.findDeviceProfileById.mockRejectedValue(new Error('Database error'))

      const response = await request(app).get('/device/device-profile-123')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to fetch device profile')
    })
  })

  describe('POST /device', () => {
    it('should create device profile for device role user', async () => {
      const mockProfile = {
        id: 'device-profile-123',
        user_id: 'device-user-123',
        device_id: 'KIOSK-001',
        device_name: 'Main Kiosk',
        device_type: 'kiosk',
        capabilities: ['dispense', 'pickup'],
        created_at: '2024-01-01T00:00:00.000Z',
      }

      DeviceProfile.findDeviceProfileByUserId.mockResolvedValue(null)
      DeviceProfile.createDeviceProfile.mockResolvedValue(mockProfile)

      const response = await request(app)
        .post('/device')
        .send({
          deviceId: 'KIOSK-001',
          deviceName: 'Main Kiosk',
          deviceType: 'kiosk',
          capabilities: ['dispense', 'pickup'],
          location: { latitude: 40.4168, longitude: -3.7038 },
        })

      expect(response.status).toBe(201)
      expect(response.body.deviceId).toBe('KIOSK-001')
      expect(DeviceProfile.createDeviceProfile).toHaveBeenCalledWith({
        userId: 'device-user-123',
        deviceId: 'KIOSK-001',
        deviceName: 'Main Kiosk',
        deviceType: 'kiosk',
        capabilities: ['dispense', 'pickup'],
        location: { latitude: 40.4168, longitude: -3.7038 },
      })
    })

    it('should return 409 if device profile already exists', async () => {
      DeviceProfile.findDeviceProfileByUserId.mockResolvedValue({
        id: 'existing-profile',
      })

      const response = await request(app)
        .post('/device')
        .send({
          deviceId: 'KIOSK-001',
          deviceName: 'Main Kiosk',
        })

      expect(response.status).toBe(409)
      expect(response.body.error).toBe('Device profile already exists')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/device')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.errors).toBeDefined()
    })
  })

  describe('PUT /device/:id', () => {
    it('should update device profile by owner', async () => {
      const mockProfile = {
        id: 'device-profile-123',
        user_id: 'device-user-123',
        device_id: 'KIOSK-001',
        device_name: 'Updated Kiosk',
      }

      DeviceProfile.findDeviceProfileById.mockResolvedValue(mockProfile)
      DeviceProfile.updateDeviceProfile.mockResolvedValue({
        ...mockProfile,
        device_name: 'Updated Kiosk',
      })

      const response = await request(app)
        .put('/device/device-profile-123')
        .send({ deviceName: 'Updated Kiosk' })

      expect(response.status).toBe(200)
      expect(response.body.deviceName).toBe('Updated Kiosk')
    })

    it('should return 403 if non-owner tries to update', async () => {
      const mockProfile = {
        id: 'device-profile-123',
        user_id: 'other-device-user',
        device_id: 'KIOSK-001',
      }

      DeviceProfile.findDeviceProfileById.mockResolvedValue(mockProfile)

      const response = await request(app)
        .put('/device/device-profile-123')
        .send({ deviceName: 'Hacked Kiosk' })

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('Forbidden')
    })

    it('should allow admin to update any device', async () => {
      const mockProfile = {
        id: 'device-profile-123',
        user_id: 'other-device-user',
        device_id: 'KIOSK-001',
      }

      DeviceProfile.findDeviceProfileById.mockResolvedValue(mockProfile)
      DeviceProfile.updateDeviceProfile.mockResolvedValue({
        ...mockProfile,
        device_name: 'Admin Updated',
      })

      const adminApp = express()
      adminApp.use(express.json())
      adminApp.put(
        '/device/:id',
        mockAdminAuth,
        deviceProfileController.updateDeviceProfile
      )

      const response = await request(adminApp)
        .put('/device/device-profile-123')
        .send({ deviceName: 'Admin Updated' })

      expect(response.status).toBe(200)
    })
  })

  describe('DELETE /device/:id', () => {
    it('should soft delete device profile by owner', async () => {
      const mockProfile = {
        id: 'device-profile-123',
        user_id: 'device-user-123',
      }

      DeviceProfile.findDeviceProfileById.mockResolvedValue(mockProfile)
      DeviceProfile.deleteDeviceProfile.mockResolvedValue({
        ...mockProfile,
        is_active: false,
      })

      const response = await request(app).delete('/device/device-profile-123')

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Device profile deleted successfully')
    })

    it('should return 403 if non-owner tries to delete', async () => {
      const mockProfile = {
        id: 'device-profile-123',
        user_id: 'other-device-user',
      }

      DeviceProfile.findDeviceProfileById.mockResolvedValue(mockProfile)

      const response = await request(app).delete('/device/device-profile-123')

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('Forbidden')
    })
  })

  describe('PUT /device/:id/capabilities', () => {
    it('should update device capabilities by owner', async () => {
      const mockProfile = {
        id: 'device-profile-123',
        user_id: 'device-user-123',
      }

      DeviceProfile.findDeviceProfileById.mockResolvedValue(mockProfile)
      DeviceProfile.updateDeviceCapabilities.mockResolvedValue({
        ...mockProfile,
        capabilities: ['dispense', 'pickup', 'return'],
      })

      const response = await request(app)
        .put('/device/device-profile-123/capabilities')
        .send({ capabilities: ['dispense', 'pickup', 'return'] })

      expect(response.status).toBe(200)
      expect(response.body.capabilities).toEqual(['dispense', 'pickup', 'return'])
    })

    it('should validate capabilities is an array', async () => {
      const response = await request(app)
        .put('/device/device-profile-123/capabilities')
        .send({ capabilities: 'invalid' })

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /device/:id/location', () => {
    it('should update device location by owner', async () => {
      const mockProfile = {
        id: 'device-profile-123',
        user_id: 'device-user-123',
      }

      DeviceProfile.findDeviceProfileById.mockResolvedValue(mockProfile)
      DeviceProfile.updateDeviceLocation.mockResolvedValue({
        ...mockProfile,
        latitude: 41.3851,
        longitude: 2.1734,
      })

      const response = await request(app)
        .put('/device/device-profile-123/location')
        .send({ latitude: 41.3851, longitude: 2.1734 })

      expect(response.status).toBe(200)
      expect(response.body.location).toEqual({ latitude: 41.3851, longitude: 2.1734 })
    })

    it('should validate latitude and longitude', async () => {
      const response = await request(app)
        .put('/device/device-profile-123/location')
        .send({ latitude: 'invalid', longitude: 2.1734 })

      expect(response.status).toBe(400)
    })
  })
})
