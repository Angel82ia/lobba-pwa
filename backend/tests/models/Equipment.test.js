import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Equipment from '../../src/models/Equipment.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js')

describe('Equipment Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createEquipment', () => {
    it('should create new equipment', async () => {
      const mockEquipment = {
        id: '123',
        name: 'Hair Dryer',
        description: 'Professional hair dryer',
        category: 'hair',
        status: 'available',
        requires_return: true,
        max_loan_days: 7,
        is_active: true,
        created_at: new Date()
      }

      pool.query.mockResolvedValue({ rows: [mockEquipment] })

      const result = await Equipment.createEquipment({
        name: 'Hair Dryer',
        description: 'Professional hair dryer',
        category: 'hair',
        requiresReturn: true,
        maxLoanDays: 7
      })

      expect(result).toEqual(mockEquipment)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO equipment'),
        expect.any(Array)
      )
    })
  })

  describe('findAllEquipment', () => {
    it('should find all equipment with filters', async () => {
      const mockEquipment = [
        { id: '1', name: 'Equipment 1', status: 'available' },
        { id: '2', name: 'Equipment 2', status: 'on_loan' }
      ]

      pool.query.mockResolvedValue({ rows: mockEquipment })

      const result = await Equipment.findAllEquipment({ page: 1, limit: 20 })

      expect(result).toEqual(mockEquipment)
      expect(pool.query).toHaveBeenCalled()
    })
  })

  describe('findEquipmentById', () => {
    it('should find equipment by id', async () => {
      const mockEquipment = {
        id: '123',
        name: 'Hair Dryer',
        status: 'available'
      }

      pool.query.mockResolvedValue({ rows: [mockEquipment] })

      const result = await Equipment.findEquipmentById('123')

      expect(result).toEqual(mockEquipment)
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM equipment WHERE id = $1',
        ['123']
      )
    })
  })

  describe('findAvailableEquipment', () => {
    it('should find all available equipment', async () => {
      const mockEquipment = [
        { id: '1', name: 'Equipment 1', status: 'available' }
      ]

      pool.query.mockResolvedValue({ rows: mockEquipment })

      const result = await Equipment.findAvailableEquipment()

      expect(result).toEqual(mockEquipment)
      expect(pool.query).toHaveBeenCalled()
    })
  })

  describe('updateEquipment', () => {
    it('should update equipment', async () => {
      const mockEquipment = {
        id: '123',
        name: 'Updated Equipment'
      }

      pool.query.mockResolvedValue({ rows: [mockEquipment] })

      const result = await Equipment.updateEquipment('123', { name: 'Updated Equipment' })

      expect(result).toEqual(mockEquipment)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE equipment'),
        expect.any(Array)
      )
    })
  })

  describe('updateEquipmentStatus', () => {
    it('should update equipment status', async () => {
      const mockEquipment = { id: '123', status: 'on_loan' }

      pool.query.mockResolvedValue({ rows: [mockEquipment] })

      const result = await Equipment.updateEquipmentStatus('123', 'on_loan')

      expect(result).toEqual(mockEquipment)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('status = $1'),
        ['on_loan', '123']
      )
    })
  })

  describe('updateEquipmentLocation', () => {
    it('should update equipment location', async () => {
      const mockEquipment = { id: '123', current_location: 'loc-456' }

      pool.query.mockResolvedValue({ rows: [mockEquipment] })

      const result = await Equipment.updateEquipmentLocation('123', 'loc-456')

      expect(result).toEqual(mockEquipment)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('current_location'),
        ['loc-456', '123']
      )
    })
  })

  describe('deleteEquipment', () => {
    it('should soft delete equipment', async () => {
      const mockEquipment = { id: '123', is_active: false }

      pool.query.mockResolvedValue({ rows: [mockEquipment] })

      const result = await Equipment.deleteEquipment('123')

      expect(result).toEqual(mockEquipment)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('is_active = false'),
        ['123']
      )
    })
  })
})
