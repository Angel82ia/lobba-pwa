import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as UsePermission from '../../src/models/UsePermission.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js')

describe('UsePermission Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createPermission', () => {
    it('should create a new permission', async () => {
      const mockPermission = {
        id: '123',
        user_id: 'user-1',
        device_id: 'device-1',
        item_id: 'item-1',
        permission_type: 'dispense',
        token: 'jwt-token',
        status: 'pending',
        expires_at: new Date(),
        created_at: new Date()
      }

      pool.query.mockResolvedValue({ rows: [mockPermission] })

      const result = await UsePermission.createPermission({
        userId: 'user-1',
        deviceId: 'device-1',
        itemId: 'item-1',
        permissionType: 'dispense',
        token: 'jwt-token',
        expiresAt: new Date()
      })

      expect(result).toEqual(mockPermission)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO use_permissions'),
        expect.any(Array)
      )
    })
  })

  describe('findPermissionById', () => {
    it('should find permission by id', async () => {
      const mockPermission = {
        id: '123',
        user_id: 'user-1',
        status: 'pending'
      }

      pool.query.mockResolvedValue({ rows: [mockPermission] })

      const result = await UsePermission.findPermissionById('123')

      expect(result).toEqual(mockPermission)
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM use_permissions WHERE id = $1',
        ['123']
      )
    })
  })

  describe('validatePermission', () => {
    it('should validate a permission by token', async () => {
      const mockPermission = {
        id: '123',
        token: 'valid-token',
        status: 'pending',
        expires_at: new Date(Date.now() + 10000)
      }

      pool.query.mockResolvedValue({ rows: [mockPermission] })

      const result = await UsePermission.validatePermission('valid-token')

      expect(result).toEqual(mockPermission)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('token = $1'),
        ['valid-token']
      )
    })
  })

  describe('updatePermissionStatus', () => {
    it('should update permission status', async () => {
      const mockPermission = { id: '123', status: 'used' }

      pool.query.mockResolvedValue({ rows: [mockPermission] })

      const result = await UsePermission.updatePermissionStatus('123', 'used', null)

      expect(result).toEqual(mockPermission)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('status = $1'),
        expect.any(Array)
      )
    })
  })

  describe('findUserPermissions', () => {
    it('should find all permissions for a user', async () => {
      const mockPermissions = [
        { id: '1', user_id: 'user-1', status: 'pending' },
        { id: '2', user_id: 'user-1', status: 'used' }
      ]

      pool.query.mockResolvedValue({ rows: mockPermissions })

      const result = await UsePermission.findUserPermissions('user-1')

      expect(result).toEqual(mockPermissions)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('user_id = $1'),
        expect.any(Array)
      )
    })
  })

  describe('findDevicePermissions', () => {
    it('should find all permissions for a device', async () => {
      const mockPermissions = [
        { id: '1', device_id: 'device-1', status: 'pending' }
      ]

      pool.query.mockResolvedValue({ rows: mockPermissions })

      const result = await UsePermission.findDevicePermissions('device-1')

      expect(result).toEqual(mockPermissions)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('device_id = $1'),
        expect.any(Array)
      )
    })
  })

  describe('cancelPermission', () => {
    it('should cancel a permission', async () => {
      const mockPermission = { id: '123', status: 'cancelled' }

      pool.query.mockResolvedValue({ rows: [mockPermission] })

      const result = await UsePermission.cancelPermission('123')

      expect(result).toEqual(mockPermission)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('status'),
        ['123']
      )
    })
  })
})
