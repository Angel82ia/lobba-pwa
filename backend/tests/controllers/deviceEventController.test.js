import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as deviceEventController from '../../src/controllers/deviceEventController.js'
import * as DeviceEvent from '../../src/models/DeviceEvent.js'
import * as UsePermission from '../../src/models/UsePermission.js'

vi.mock('../../src/models/DeviceEvent.js')
vi.mock('../../src/models/UsePermission.js')

describe('DeviceEvent Controller', () => {
  let req, res

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-1', role: 'device' }
    }
    res = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis()
    }
    vi.clearAllMocks()
  })

  describe('createEvent', () => {
    it('should create event as device role', async () => {
      req.body = {
        deviceId: 'device-1',
        permissionId: 'perm-1',
        eventType: 'dispense_success',
        eventData: { item_id: 'item-1' }
      }
      const mockEvent = { id: 'event-1', ...req.body }
      DeviceEvent.createEvent.mockResolvedValue(mockEvent)

      await deviceEventController.createEvent(req, res)

      expect(DeviceEvent.createEvent).toHaveBeenCalledWith({
        deviceId: 'device-1',
        permissionId: 'perm-1',
        eventType: 'dispense_success',
        eventData: { item_id: 'item-1' }
      })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockEvent)
    })

    it('should allow admin to create event', async () => {
      req.user.role = 'admin'
      req.body = {
        deviceId: 'device-1',
        eventType: 'dispense_success'
      }
      const mockEvent = { id: 'event-1' }
      DeviceEvent.createEvent.mockResolvedValue(mockEvent)

      await deviceEventController.createEvent(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('should return 403 if not device or admin', async () => {
      req.user.role = 'user'

      await deviceEventController.createEvent(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Acceso no autorizado'
      })
    })

    it('should return 400 if deviceId or eventType missing', async () => {
      req.body = { deviceId: 'device-1' }

      await deviceEventController.createEvent(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'ID de dispositivo y tipo de evento son requeridos'
      })
    })
  })

  describe('getDeviceEvents', () => {
    it('should get device events as admin', async () => {
      req.user.role = 'admin'
      req.params = { deviceId: 'device-1' }
      req.query = { page: 1, limit: 20 }
      const mockEvents = [{ id: '1' }, { id: '2' }]
      DeviceEvent.findDeviceEvents.mockResolvedValue(mockEvents)

      await deviceEventController.getDeviceEvents(req, res)

      expect(DeviceEvent.findDeviceEvents).toHaveBeenCalledWith('device-1', {
        page: 1,
        limit: 20
      })
      expect(res.json).toHaveBeenCalledWith(mockEvents)
    })

    it('should allow device role to get events', async () => {
      req.user.role = 'device'
      req.params = { deviceId: 'device-1' }
      const mockEvents = [{ id: '1' }]
      DeviceEvent.findDeviceEvents.mockResolvedValue(mockEvents)

      await deviceEventController.getDeviceEvents(req, res)

      expect(res.json).toHaveBeenCalledWith(mockEvents)
    })

    it('should return 403 if not admin or device', async () => {
      req.user.role = 'user'

      await deviceEventController.getDeviceEvents(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })
  })

  describe('getUserEvents', () => {
    it('should get user events', async () => {
      req.query = { page: 1, limit: 20 }
      const mockEvents = [{ id: '1' }, { id: '2' }]
      DeviceEvent.findUserEvents.mockResolvedValue(mockEvents)

      await deviceEventController.getUserEvents(req, res)

      expect(DeviceEvent.findUserEvents).toHaveBeenCalledWith('user-1', {
        page: 1,
        limit: 20
      })
      expect(res.json).toHaveBeenCalledWith(mockEvents)
    })
  })

  describe('getEventsByPermission', () => {
    it('should get events by permission', async () => {
      req.params = { permissionId: 'perm-1' }
      const mockPermission = { id: 'perm-1', user_id: 'user-1' }
      const mockEvents = [{ id: '1' }]
      
      UsePermission.findPermissionById.mockResolvedValue(mockPermission)
      DeviceEvent.findEventsByPermission.mockResolvedValue(mockEvents)

      await deviceEventController.getEventsByPermission(req, res)

      expect(DeviceEvent.findEventsByPermission).toHaveBeenCalledWith('perm-1')
      expect(res.json).toHaveBeenCalledWith(mockEvents)
    })

    it('should return 404 if permission not found', async () => {
      req.params = { permissionId: 'perm-1' }
      UsePermission.findPermissionById.mockResolvedValue(null)

      await deviceEventController.getEventsByPermission(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Permiso no encontrado'
      })
    })

    it('should return 403 if not authorized', async () => {
      req.params = { permissionId: 'perm-1' }
      const mockPermission = { id: 'perm-1', user_id: 'other-user' }
      UsePermission.findPermissionById.mockResolvedValue(mockPermission)

      await deviceEventController.getEventsByPermission(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('should allow admin to view any permission events', async () => {
      req.user.role = 'admin'
      req.params = { permissionId: 'perm-1' }
      const mockPermission = { id: 'perm-1', user_id: 'other-user' }
      const mockEvents = [{ id: '1' }]
      
      UsePermission.findPermissionById.mockResolvedValue(mockPermission)
      DeviceEvent.findEventsByPermission.mockResolvedValue(mockEvents)

      await deviceEventController.getEventsByPermission(req, res)

      expect(res.json).toHaveBeenCalledWith(mockEvents)
    })
  })

  describe('getRecentErrors', () => {
    it('should get recent errors as admin', async () => {
      req.user.role = 'admin'
      req.query = { hours: 24, limit: 50 }
      const mockErrors = [{ id: '1', event_type: 'dispense_error' }]
      DeviceEvent.findRecentErrors.mockResolvedValue(mockErrors)

      await deviceEventController.getRecentErrors(req, res)

      expect(DeviceEvent.findRecentErrors).toHaveBeenCalledWith({
        hours: 24,
        limit: 50
      })
      expect(res.json).toHaveBeenCalledWith(mockErrors)
    })

    it('should return 403 if not admin', async () => {
      req.user.role = 'user'

      await deviceEventController.getRecentErrors(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })
  })

  describe('getDeviceStats', () => {
    it('should get device stats as admin', async () => {
      req.user.role = 'admin'
      req.params = { deviceId: 'device-1' }
      req.query = { days: 7 }
      const mockStats = {
        total_events: 100,
        success_rate: 0.95,
        error_count: 5
      }
      DeviceEvent.getDeviceStats.mockResolvedValue(mockStats)

      await deviceEventController.getDeviceStats(req, res)

      expect(DeviceEvent.getDeviceStats).toHaveBeenCalledWith('device-1', {
        days: 7
      })
      expect(res.json).toHaveBeenCalledWith(mockStats)
    })

    it('should allow device role to get own stats', async () => {
      req.user.role = 'device'
      req.params = { deviceId: 'device-1' }
      const mockStats = { total_events: 50 }
      DeviceEvent.getDeviceStats.mockResolvedValue(mockStats)

      await deviceEventController.getDeviceStats(req, res)

      expect(res.json).toHaveBeenCalledWith(mockStats)
    })

    it('should return 403 if not admin or device', async () => {
      req.user.role = 'user'

      await deviceEventController.getDeviceStats(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })
  })
})
