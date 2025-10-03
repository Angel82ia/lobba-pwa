import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as deviceEventService from './deviceEvent'
import apiClient from './api'

vi.mock('./api')

describe('DeviceEvent Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createEvent', () => {
    it('should create a device event', async () => {
      const eventData = {
        deviceId: 'device-1',
        eventType: 'dispense_success',
        eventData: { item_id: 'item-1' }
      }
      const mockEvent = { id: '1', ...eventData }
      apiClient.post.mockResolvedValue({ data: mockEvent })

      const result = await deviceEventService.createEvent(eventData)

      expect(apiClient.post).toHaveBeenCalledWith('/device-events', eventData)
      expect(result).toEqual(mockEvent)
    })
  })

  describe('getDeviceEvents', () => {
    it('should get device events with pagination', async () => {
      const mockEvents = [{ id: '1' }, { id: '2' }]
      apiClient.get.mockResolvedValue({ data: mockEvents })

      const result = await deviceEventService.getDeviceEvents('device-1', 1, 20)

      expect(apiClient.get).toHaveBeenCalledWith('/device-events/device/device-1', {
        params: { page: 1, limit: 20 }
      })
      expect(result).toEqual(mockEvents)
    })
  })

  describe('getUserEvents', () => {
    it('should get user events with pagination', async () => {
      const mockEvents = [{ id: '1' }, { id: '2' }]
      apiClient.get.mockResolvedValue({ data: mockEvents })

      const result = await deviceEventService.getUserEvents(1, 20)

      expect(apiClient.get).toHaveBeenCalledWith('/device-events/user', {
        params: { page: 1, limit: 20 }
      })
      expect(result).toEqual(mockEvents)
    })
  })

  describe('getEventsByPermission', () => {
    it('should get events by permission id', async () => {
      const mockEvents = [{ id: '1' }]
      apiClient.get.mockResolvedValue({ data: mockEvents })

      const result = await deviceEventService.getEventsByPermission('perm-1')

      expect(apiClient.get).toHaveBeenCalledWith('/device-events/permission/perm-1')
      expect(result).toEqual(mockEvents)
    })
  })

  describe('getRecentErrors', () => {
    it('should get recent error events', async () => {
      const mockErrors = [{ id: '1', event_type: 'dispense_error' }]
      apiClient.get.mockResolvedValue({ data: mockErrors })

      const result = await deviceEventService.getRecentErrors(24, 50)

      expect(apiClient.get).toHaveBeenCalledWith('/device-events/errors', {
        params: { hours: 24, limit: 50 }
      })
      expect(result).toEqual(mockErrors)
    })
  })

  describe('getDeviceStats', () => {
    it('should get device statistics', async () => {
      const mockStats = {
        total_events: 100,
        success_rate: 0.95,
        error_count: 5
      }
      apiClient.get.mockResolvedValue({ data: mockStats })

      const result = await deviceEventService.getDeviceStats('device-1', 7)

      expect(apiClient.get).toHaveBeenCalledWith('/device-events/device/device-1/stats', {
        params: { days: 7 }
      })
      expect(result).toEqual(mockStats)
    })
  })
})
