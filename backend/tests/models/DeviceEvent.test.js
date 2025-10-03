import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as DeviceEvent from '../../src/models/DeviceEvent.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js')

describe('DeviceEvent Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createEvent', () => {
    it('should create a new device event', async () => {
      const mockEvent = {
        id: '123',
        device_id: 'device-1',
        permission_id: 'perm-1',
        event_type: 'dispense_success',
        event_data: { item_id: 'item-1' },
        created_at: new Date()
      }

      pool.query.mockResolvedValue({ rows: [mockEvent] })

      const result = await DeviceEvent.createEvent({
        deviceId: 'device-1',
        permissionId: 'perm-1',
        eventType: 'dispense_success',
        eventData: { item_id: 'item-1' }
      })

      expect(result).toEqual(mockEvent)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO device_events'),
        expect.any(Array)
      )
    })
  })

  describe('findEventById', () => {
    it('should find event by id', async () => {
      const mockEvent = {
        id: '123',
        event_type: 'dispense_success'
      }

      pool.query.mockResolvedValue({ rows: [mockEvent] })

      const result = await DeviceEvent.findEventById('123')

      expect(result).toEqual(mockEvent)
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM device_events WHERE id = $1',
        ['123']
      )
    })
  })

  describe('findDeviceEvents', () => {
    it('should find all events for a device', async () => {
      const mockEvents = [
        { id: '1', device_id: 'device-1', event_type: 'dispense_success' },
        { id: '2', device_id: 'device-1', event_type: 'pickup_success' }
      ]

      pool.query.mockResolvedValue({ rows: mockEvents })

      const result = await DeviceEvent.findDeviceEvents('device-1', { page: 1, limit: 20 })

      expect(result).toEqual(mockEvents)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('device_id = $1'),
        expect.any(Array)
      )
    })
  })

  describe('findUserEvents', () => {
    it('should find all events for a user', async () => {
      const mockEvents = [
        { id: '1', user_id: 'user-1', event_type: 'dispense_success' }
      ]

      pool.query.mockResolvedValue({ rows: mockEvents })

      const result = await DeviceEvent.findUserEvents('user-1', { page: 1, limit: 20 })

      expect(result).toEqual(mockEvents)
      expect(pool.query).toHaveBeenCalled()
    })
  })

  describe('findEventsByPermission', () => {
    it('should find all events for a permission', async () => {
      const mockEvents = [
        { id: '1', permission_id: 'perm-1', event_type: 'dispense_success' }
      ]

      pool.query.mockResolvedValue({ rows: mockEvents })

      const result = await DeviceEvent.findEventsByPermission('perm-1')

      expect(result).toEqual(mockEvents)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('permission_id = $1'),
        ['perm-1']
      )
    })
  })

  describe('findRecentErrors', () => {
    it('should find recent error events', async () => {
      const mockEvents = [
        { id: '1', event_type: 'dispense_error', event_data: { error: 'Stock empty' } }
      ]

      pool.query.mockResolvedValue({ rows: mockEvents })

      const result = await DeviceEvent.findRecentErrors({ hours: 24, limit: 50 })

      expect(result).toEqual(mockEvents)
      expect(pool.query).toHaveBeenCalled()
    })
  })

  describe('getDeviceStats', () => {
    it('should get device statistics', async () => {
      const mockStats = {
        total_events: 100,
        success_rate: 0.95,
        error_count: 5
      }

      pool.query.mockResolvedValue({ rows: [mockStats] })

      const result = await DeviceEvent.getDeviceStats('device-1', { days: 7 })

      expect(result).toEqual([mockStats])
      expect(pool.query).toHaveBeenCalled()
    })
  })
})
