import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as permissionService from './permission'
import apiClient from './api'

vi.mock('./api')

describe('Permission Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requestItemPermission', () => {
    it('should request item permission', async () => {
      const mockResponse = {
        permission: { id: '1' },
        token: 'jwt-token'
      }
      apiClient.post.mockResolvedValue({ data: mockResponse })

      const result = await permissionService.requestItemPermission('device-1', 'item-1')

      expect(apiClient.post).toHaveBeenCalledWith('/permissions/item', {
        deviceId: 'device-1',
        itemId: 'item-1'
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('requestEquipmentPickup', () => {
    it('should request equipment pickup permission', async () => {
      const mockResponse = {
        permission: { id: '1' },
        token: 'jwt-token'
      }
      apiClient.post.mockResolvedValue({ data: mockResponse })

      const result = await permissionService.requestEquipmentPickup('device-1', 'equip-1')

      expect(apiClient.post).toHaveBeenCalledWith('/permissions/equipment/pickup', {
        deviceId: 'device-1',
        equipmentId: 'equip-1'
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('requestEquipmentReturn', () => {
    it('should request equipment return permission', async () => {
      const mockResponse = {
        permission: { id: '1' },
        token: 'jwt-token'
      }
      apiClient.post.mockResolvedValue({ data: mockResponse })

      const result = await permissionService.requestEquipmentReturn('device-1', 'equip-1')

      expect(apiClient.post).toHaveBeenCalledWith('/permissions/equipment/return', {
        deviceId: 'device-1',
        equipmentId: 'equip-1'
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('validatePermission', () => {
    it('should validate a permission token', async () => {
      const mockResponse = {
        valid: true,
        permission: { id: '1' }
      }
      apiClient.post.mockResolvedValue({ data: mockResponse })

      const result = await permissionService.validatePermission('valid-token')

      expect(apiClient.post).toHaveBeenCalledWith('/permissions/validate', {
        token: 'valid-token'
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getUserPermissions', () => {
    it('should get user permissions', async () => {
      const mockPermissions = [{ id: '1' }, { id: '2' }]
      apiClient.get.mockResolvedValue({ data: mockPermissions })

      const result = await permissionService.getUserPermissions('pending')

      expect(apiClient.get).toHaveBeenCalledWith('/permissions/user', {
        params: { status: 'pending' }
      })
      expect(result).toEqual(mockPermissions)
    })

    it('should get user permissions without status filter', async () => {
      const mockPermissions = [{ id: '1' }]
      apiClient.get.mockResolvedValue({ data: mockPermissions })

      const result = await permissionService.getUserPermissions()

      expect(apiClient.get).toHaveBeenCalledWith('/permissions/user', {
        params: { status: null }
      })
      expect(result).toEqual(mockPermissions)
    })
  })

  describe('getDevicePermissions', () => {
    it('should get device permissions', async () => {
      const mockPermissions = [{ id: '1' }]
      apiClient.get.mockResolvedValue({ data: mockPermissions })

      const result = await permissionService.getDevicePermissions('device-1', 'used')

      expect(apiClient.get).toHaveBeenCalledWith('/permissions/device/device-1', {
        params: { status: 'used' }
      })
      expect(result).toEqual(mockPermissions)
    })
  })

  describe('cancelPermission', () => {
    it('should cancel a permission', async () => {
      const mockResponse = { message: 'Cancelled' }
      apiClient.delete.mockResolvedValue({ data: mockResponse })

      const result = await permissionService.cancelPermission('1')

      expect(apiClient.delete).toHaveBeenCalledWith('/permissions/1')
      expect(result).toEqual(mockResponse)
    })
  })
})
