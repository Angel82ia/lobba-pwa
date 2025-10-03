import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as DeviceCapability from '../../src/models/DeviceCapability.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js')

describe('DeviceCapability Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createCapability', () => {
    it('should create a new capability', async () => {
      const mockCapability = {
        id: '123',
        device_id: 'device-1',
        capability_type: 'dispense',
        metadata: { slots: 10 },
        is_active: true,
        created_at: new Date()
      }

      pool.query.mockResolvedValue({ rows: [mockCapability] })

      const result = await DeviceCapability.createCapability({
        deviceId: 'device-1',
        capabilityType: 'dispense',
        metadata: { slots: 10 }
      })

      expect(result).toEqual(mockCapability)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO device_capabilities'),
        expect.any(Array)
      )
    })
  })

  describe('findCapabilitiesByDevice', () => {
    it('should find all active capabilities for a device', async () => {
      const mockCapabilities = [
        { id: '1', capability_type: 'dispense', is_active: true },
        { id: '2', capability_type: 'loan', is_active: true }
      ]

      pool.query.mockResolvedValue({ rows: mockCapabilities })

      const result = await DeviceCapability.findCapabilitiesByDevice('device-1')

      expect(result).toEqual(mockCapabilities)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('device_id = $1'),
        ['device-1']
      )
    })
  })

  describe('findCapabilityById', () => {
    it('should find capability by id', async () => {
      const mockCapability = {
        id: '123',
        capability_type: 'dispense'
      }

      pool.query.mockResolvedValue({ rows: [mockCapability] })

      const result = await DeviceCapability.findCapabilityById('123')

      expect(result).toEqual(mockCapability)
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM device_capabilities WHERE id = $1',
        ['123']
      )
    })
  })

  describe('updateCapability', () => {
    it('should update a capability', async () => {
      const mockCapability = {
        id: '123',
        metadata: { slots: 20 }
      }

      pool.query.mockResolvedValue({ rows: [mockCapability] })

      const result = await DeviceCapability.updateCapability('123', { metadata: { slots: 20 } })

      expect(result).toEqual(mockCapability)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE device_capabilities'),
        expect.any(Array)
      )
    })
  })

  describe('deleteCapability', () => {
    it('should soft delete a capability', async () => {
      const mockCapability = { id: '123', is_active: false }

      pool.query.mockResolvedValue({ rows: [mockCapability] })

      const result = await DeviceCapability.deleteCapability('123')

      expect(result).toEqual(mockCapability)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('is_active = false'),
        ['123']
      )
    })
  })

  describe('hasCapability', () => {
    it('should check if device has a specific capability', async () => {
      pool.query.mockResolvedValue({ rows: [{ has_capability: true }] })

      const result = await DeviceCapability.hasCapability('device-1', 'dispense')

      expect(result).toBe(true)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('EXISTS'),
        ['device-1', 'dispense']
      )
    })

    it('should return false if device does not have capability', async () => {
      pool.query.mockResolvedValue({ rows: [{ has_capability: false }] })

      const result = await DeviceCapability.hasCapability('device-1', 'print')

      expect(result).toBe(false)
    })
  })
})
