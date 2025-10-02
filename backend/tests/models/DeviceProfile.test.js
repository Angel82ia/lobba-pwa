import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import pool from '../../src/config/database.js'
import {
  createDeviceProfile,
  findDeviceProfileById,
  findDeviceProfileByDeviceId,
  findDeviceProfileByUserId,
  updateDeviceProfile,
  deleteDeviceProfile,
  updateDeviceCapabilities,
  updateDeviceLocation,
} from '../../src/models/DeviceProfile.js'

vi.mock('../../src/config/database.js')

describe('DeviceProfile Model', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createDeviceProfile', () => {
    it('should create a new device profile with all fields', async () => {
      const mockResult = {
        rows: [{
          id: 'device-profile-uuid',
          user_id: 'user-uuid',
          device_id: 'DEV-001',
          device_name: 'Kiosko Lobba Centro',
          device_type: 'kiosk',
          capabilities: ['dispense', 'pickup', 'return', 'telemetry'],
          location: '0101000020E6100000000000000000F03F0000000000000040',
          latitude: 40.416775,
          longitude: -3.703790,
          is_active: true,
          last_seen: '2024-01-01T00:00:00.000Z',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const deviceData = {
        userId: 'user-uuid',
        deviceId: 'DEV-001',
        deviceName: 'Kiosko Lobba Centro',
        deviceType: 'kiosk',
        capabilities: ['dispense', 'pickup', 'return', 'telemetry'],
        location: { latitude: 40.416775, longitude: -3.703790 },
      }

      const result = await createDeviceProfile(deviceData)

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          'user-uuid',
          'DEV-001',
          'Kiosko Lobba Centro',
          'kiosk',
          expect.any(String),
          -3.703790,
          40.416775,
        ])
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('INSERT INTO device_profiles')
      expect(sqlQuery).toContain('ST_SetSRID(ST_MakePoint')
      expect(result).toEqual(mockResult.rows[0])
    })

    it('should create device profile without location', async () => {
      const mockResult = {
        rows: [{
          id: 'device-profile-uuid',
          user_id: 'user-uuid',
          device_id: 'DEV-002',
          device_name: 'Remote Device',
          capabilities: ['telemetry'],
          location: null,
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const deviceData = {
        userId: 'user-uuid',
        deviceId: 'DEV-002',
        deviceName: 'Remote Device',
        capabilities: ['telemetry'],
      }

      const result = await createDeviceProfile(deviceData)

      expect(pool.query).toHaveBeenCalled()
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('findDeviceProfileById', () => {
    it('should find device profile by ID with location', async () => {
      const mockResult = {
        rows: [{
          id: 'device-profile-uuid',
          device_id: 'DEV-001',
          latitude: 40.416775,
          longitude: -3.703790,
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await findDeviceProfileById('device-profile-uuid')

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['device-profile-uuid']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('SELECT')
      expect(sqlQuery).toContain('device_profiles')
      expect(sqlQuery).toContain('ST_Y(')
      expect(sqlQuery).toContain('ST_X(')
      expect(sqlQuery).toContain('WHERE id = $1')
      expect(result).toEqual(mockResult.rows[0])
    })

    it('should return undefined when device profile not found', async () => {
      const mockResult = { rows: [] }
      pool.query.mockResolvedValue(mockResult)

      const result = await findDeviceProfileById('nonexistent')

      expect(result).toBeUndefined()
    })
  })

  describe('findDeviceProfileByDeviceId', () => {
    it('should find device profile by device_id', async () => {
      const mockResult = {
        rows: [{
          id: 'device-profile-uuid',
          device_id: 'DEV-001',
          device_name: 'Kiosko Centro',
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await findDeviceProfileByDeviceId('DEV-001')

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['DEV-001']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('WHERE device_id = $1')
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('findDeviceProfileByUserId', () => {
    it('should find device profile by user_id', async () => {
      const mockResult = {
        rows: [{
          id: 'device-profile-uuid',
          user_id: 'user-uuid',
          device_id: 'DEV-001',
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await findDeviceProfileByUserId('user-uuid')

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user-uuid']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('WHERE user_id = $1')
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('updateDeviceProfile', () => {
    it('should update device profile fields', async () => {
      const mockResult = {
        rows: [{
          id: 'device-profile-uuid',
          device_name: 'Kiosko Centro Actualizado',
          device_type: 'kiosk',
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const updates = {
        deviceName: 'Kiosko Centro Actualizado',
      }

      const result = await updateDeviceProfile('device-profile-uuid', updates)

      expect(pool.query).toHaveBeenCalled()
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('UPDATE device_profiles')
      expect(sqlQuery).toContain('updated_at = CURRENT_TIMESTAMP')
      expect(result).toEqual(mockResult.rows[0])
    })

    it('should handle empty updates', async () => {
      const mockResult = {
        rows: [{
          id: 'device-profile-uuid',
          device_name: 'Existing Device',
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await updateDeviceProfile('device-profile-uuid', {})

      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('deleteDeviceProfile', () => {
    it('should soft delete device profile', async () => {
      const mockResult = {
        rows: [{
          id: 'device-profile-uuid',
          is_active: false,
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await deleteDeviceProfile('device-profile-uuid')

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['device-profile-uuid']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('UPDATE device_profiles')
      expect(sqlQuery).toContain('is_active = false')
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('updateDeviceCapabilities', () => {
    it('should update device capabilities', async () => {
      const mockResult = {
        rows: [{
          id: 'device-profile-uuid',
          capabilities: ['dispense', 'pickup', 'telemetry'],
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const newCapabilities = ['dispense', 'pickup', 'telemetry']
      const result = await updateDeviceCapabilities('device-profile-uuid', newCapabilities)

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        [expect.any(String), 'device-profile-uuid']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('UPDATE device_profiles')
      expect(sqlQuery).toContain('capabilities = $1')
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('updateDeviceLocation', () => {
    it('should update device location', async () => {
      const mockResult = {
        rows: [{
          id: 'device-profile-uuid',
          latitude: 41.385064,
          longitude: 2.173404,
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const newLocation = { latitude: 41.385064, longitude: 2.173404 }
      const result = await updateDeviceLocation('device-profile-uuid', newLocation)

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        [2.173404, 41.385064, 'device-profile-uuid']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('UPDATE device_profiles')
      expect(sqlQuery).toContain('ST_SetSRID(ST_MakePoint')
      expect(result).toEqual(mockResult.rows[0])
    })
  })
})
