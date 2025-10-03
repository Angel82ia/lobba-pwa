import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as permissionController from '../../src/controllers/permissionController.js'
import * as UsePermission from '../../src/models/UsePermission.js'
import * as Item from '../../src/models/Item.js'
import * as Equipment from '../../src/models/Equipment.js'
import * as UserQuota from '../../src/models/UserQuota.js'
import * as DeviceProfile from '../../src/models/DeviceProfile.js'
import jwt from 'jsonwebtoken'

vi.mock('../../src/models/UsePermission.js')
vi.mock('../../src/models/Item.js')
vi.mock('../../src/models/Equipment.js')
vi.mock('../../src/models/UserQuota.js')
vi.mock('../../src/models/DeviceProfile.js')
vi.mock('jsonwebtoken')

describe('Permission Controller', () => {
  let req, res

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-1', role: 'user' }
    }
    res = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis()
    }
    vi.clearAllMocks()
  })

  describe('requestItemPermission', () => {
    it('should create item permission for valid request', async () => {
      req.body = { deviceId: 'device-1', itemId: 'item-1' }
      
      const mockItem = { id: 'item-1', name: 'Test Item', is_active: true, stock_quantity: 10, monthly_limit: 100 }
      const mockDevice = { id: 'device-1', is_active: true }
      const mockQuota = { items_used_this_month: 5 }
      const mockPermission = { id: 'perm-1', token: 'jwt-token' }

      Item.findItemById.mockResolvedValue(mockItem)
      DeviceProfile.findDeviceProfileById.mockResolvedValue(mockDevice)
      UserQuota.getOrCreateQuota.mockResolvedValue(mockQuota)
      jwt.sign.mockReturnValue('jwt-token')
      UsePermission.createPermission.mockResolvedValue(mockPermission)

      await permissionController.requestItemPermission(req, res)

      expect(UsePermission.createPermission).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        permission: mockPermission,
        token: 'jwt-token'
      }))
    })

    it('should return 400 if deviceId or itemId missing', async () => {
      req.body = { deviceId: 'device-1' }

      await permissionController.requestItemPermission(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'ID de dispositivo y artículo son requeridos'
      })
    })

    it('should return 404 if item not found', async () => {
      req.body = { deviceId: 'device-1', itemId: 'item-1' }
      Item.findItemById.mockResolvedValue(null)

      await permissionController.requestItemPermission(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Artículo no disponible'
      })
    })

    it('should return 400 if item out of stock', async () => {
      req.body = { deviceId: 'device-1', itemId: 'item-1' }
      const mockItem = { id: 'item-1', is_active: true, stock_quantity: 0 }
      Item.findItemById.mockResolvedValue(mockItem)

      await permissionController.requestItemPermission(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Artículo sin stock'
      })
    })

    it('should return 403 if monthly limit reached', async () => {
      req.body = { deviceId: 'device-1', itemId: 'item-1' }
      
      const mockItem = { id: 'item-1', is_active: true, stock_quantity: 10, monthly_limit: 10 }
      const mockDevice = { id: 'device-1', is_active: true }
      const mockQuota = { items_used_this_month: 10 }

      Item.findItemById.mockResolvedValue(mockItem)
      DeviceProfile.findDeviceProfileById.mockResolvedValue(mockDevice)
      UserQuota.getOrCreateQuota.mockResolvedValue(mockQuota)

      await permissionController.requestItemPermission(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Límite mensual alcanzado para este artículo'
      })
    })
  })

  describe('requestEquipmentPickup', () => {
    it('should create equipment pickup permission', async () => {
      req.body = { deviceId: 'device-1', equipmentId: 'equip-1' }
      
      const mockEquipment = { id: 'equip-1', name: 'Hair Dryer', is_active: true, status: 'available', max_loan_days: 7 }
      const mockDevice = { id: 'device-1', is_active: true }
      const mockQuota = { equipment_loans_active: 1 }
      const mockPermission = { id: 'perm-1', token: 'jwt-token' }

      Equipment.findEquipmentById.mockResolvedValue(mockEquipment)
      DeviceProfile.findDeviceProfileById.mockResolvedValue(mockDevice)
      UserQuota.getOrCreateQuota.mockResolvedValue(mockQuota)
      jwt.sign.mockReturnValue('jwt-token')
      UsePermission.createPermission.mockResolvedValue(mockPermission)

      await permissionController.requestEquipmentPickup(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        permission: mockPermission,
        token: 'jwt-token'
      }))
    })

    it('should return 400 if equipment not available', async () => {
      req.body = { deviceId: 'device-1', equipmentId: 'equip-1' }
      
      const mockEquipment = { id: 'equip-1', is_active: true, status: 'on_loan' }
      Equipment.findEquipmentById.mockResolvedValue(mockEquipment)

      await permissionController.requestEquipmentPickup(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Equipo no está disponible para préstamo'
      })
    })

    it('should return 403 if max loans reached', async () => {
      req.body = { deviceId: 'device-1', equipmentId: 'equip-1' }
      
      const mockEquipment = { id: 'equip-1', is_active: true, status: 'available' }
      const mockDevice = { id: 'device-1', is_active: true }
      const mockQuota = { equipment_loans_active: 3 }

      Equipment.findEquipmentById.mockResolvedValue(mockEquipment)
      DeviceProfile.findDeviceProfileById.mockResolvedValue(mockDevice)
      UserQuota.getOrCreateQuota.mockResolvedValue(mockQuota)

      await permissionController.requestEquipmentPickup(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Límite de préstamos activos alcanzado (máximo 3)'
      })
    })
  })

  describe('requestEquipmentReturn', () => {
    it('should create equipment return permission', async () => {
      req.body = { deviceId: 'device-1', equipmentId: 'equip-1' }
      
      const mockEquipment = { id: 'equip-1', name: 'Hair Dryer', status: 'on_loan' }
      const mockDevice = { id: 'device-1', is_active: true }
      const mockPermission = { id: 'perm-1', token: 'jwt-token' }

      Equipment.findEquipmentById.mockResolvedValue(mockEquipment)
      DeviceProfile.findDeviceProfileById.mockResolvedValue(mockDevice)
      jwt.sign.mockReturnValue('jwt-token')
      UsePermission.createPermission.mockResolvedValue(mockPermission)

      await permissionController.requestEquipmentReturn(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('should return 400 if equipment not on loan', async () => {
      req.body = { deviceId: 'device-1', equipmentId: 'equip-1' }
      
      const mockEquipment = { id: 'equip-1', status: 'available' }
      Equipment.findEquipmentById.mockResolvedValue(mockEquipment)

      await permissionController.requestEquipmentReturn(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Equipo no está en préstamo'
      })
    })
  })

  describe('validatePermission', () => {
    it('should validate a permission token', async () => {
      req.body = { token: 'valid-token' }
      const mockPermission = { id: 'perm-1', status: 'pending' }
      UsePermission.validatePermission.mockResolvedValue(mockPermission)

      await permissionController.validatePermission(req, res)

      expect(UsePermission.validatePermission).toHaveBeenCalledWith('valid-token')
      expect(res.json).toHaveBeenCalledWith({
        valid: true,
        permission: mockPermission
      })
    })

    it('should return 404 if permission invalid', async () => {
      req.body = { token: 'invalid-token' }
      UsePermission.validatePermission.mockResolvedValue(null)

      await permissionController.validatePermission(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Permiso inválido o expirado'
      })
    })

    it('should return 400 if token is missing', async () => {
      req.body = {}

      await permissionController.validatePermission(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('getUserPermissions', () => {
    it('should get user permissions', async () => {
      const mockPermissions = [{ id: '1' }, { id: '2' }]
      UsePermission.findUserPermissions.mockResolvedValue(mockPermissions)

      await permissionController.getUserPermissions(req, res)

      expect(UsePermission.findUserPermissions).toHaveBeenCalledWith('user-1', null)
      expect(res.json).toHaveBeenCalledWith(mockPermissions)
    })
  })

  describe('getDevicePermissions', () => {
    it('should get device permissions as admin', async () => {
      req.user.role = 'admin'
      req.params = { deviceId: 'device-1' }
      const mockPermissions = [{ id: '1' }]
      UsePermission.findDevicePermissions.mockResolvedValue(mockPermissions)

      await permissionController.getDevicePermissions(req, res)

      expect(UsePermission.findDevicePermissions).toHaveBeenCalledWith('device-1', null)
      expect(res.json).toHaveBeenCalledWith(mockPermissions)
    })

    it('should allow device role to get permissions', async () => {
      req.user.role = 'device'
      req.params = { deviceId: 'device-1' }
      const mockPermissions = [{ id: '1' }]
      UsePermission.findDevicePermissions.mockResolvedValue(mockPermissions)

      await permissionController.getDevicePermissions(req, res)

      expect(res.json).toHaveBeenCalledWith(mockPermissions)
    })

    it('should return 403 if not admin or device', async () => {
      req.user.role = 'user'

      await permissionController.getDevicePermissions(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })
  })

  describe('cancelPermission', () => {
    it('should cancel own permission', async () => {
      req.params = { id: 'perm-1' }
      const mockPermission = { id: 'perm-1', user_id: 'user-1', status: 'pending' }
      const cancelledPermission = { ...mockPermission, status: 'cancelled' }
      
      UsePermission.findPermissionById.mockResolvedValue(mockPermission)
      UsePermission.cancelPermission.mockResolvedValue(cancelledPermission)

      await permissionController.cancelPermission(req, res)

      expect(UsePermission.cancelPermission).toHaveBeenCalledWith('perm-1')
      expect(res.json).toHaveBeenCalledWith(cancelledPermission)
    })

    it('should return 404 if permission not found', async () => {
      req.params = { id: 'perm-1' }
      UsePermission.findPermissionById.mockResolvedValue(null)

      await permissionController.cancelPermission(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('should return 403 if not authorized', async () => {
      req.params = { id: 'perm-1' }
      const mockPermission = { id: 'perm-1', user_id: 'other-user', status: 'pending' }
      UsePermission.findPermissionById.mockResolvedValue(mockPermission)

      await permissionController.cancelPermission(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('should return 400 if permission not pending', async () => {
      req.params = { id: 'perm-1' }
      const mockPermission = { id: 'perm-1', user_id: 'user-1', status: 'used' }
      UsePermission.findPermissionById.mockResolvedValue(mockPermission)

      await permissionController.cancelPermission(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Solo se pueden cancelar permisos pendientes'
      })
    })
  })
})
