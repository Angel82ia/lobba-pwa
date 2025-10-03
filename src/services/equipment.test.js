import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as equipmentService from './equipment'
import apiClient from './api'

vi.mock('./api')

describe('Equipment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllEquipment', () => {
    it('should get all equipment with filters', async () => {
      const mockEquipment = [
        { id: '1', name: 'Equipment 1' },
        { id: '2', name: 'Equipment 2' }
      ]
      apiClient.get.mockResolvedValue({ data: mockEquipment })

      const result = await equipmentService.getAllEquipment(1, 20, 'available', 'hair', true)

      expect(apiClient.get).toHaveBeenCalledWith('/equipment', {
        params: { page: 1, limit: 20, status: 'available', category: 'hair', isActive: true }
      })
      expect(result).toEqual(mockEquipment)
    })
  })

  describe('getAvailableEquipment', () => {
    it('should get available equipment', async () => {
      const mockEquipment = [{ id: '1', status: 'available' }]
      apiClient.get.mockResolvedValue({ data: mockEquipment })

      const result = await equipmentService.getAvailableEquipment('hair')

      expect(apiClient.get).toHaveBeenCalledWith('/equipment/available', {
        params: { category: 'hair' }
      })
      expect(result).toEqual(mockEquipment)
    })
  })

  describe('getEquipmentById', () => {
    it('should get equipment by id', async () => {
      const mockEquipment = { id: '1', name: 'Hair Dryer' }
      apiClient.get.mockResolvedValue({ data: mockEquipment })

      const result = await equipmentService.getEquipmentById('1')

      expect(apiClient.get).toHaveBeenCalledWith('/equipment/1')
      expect(result).toEqual(mockEquipment)
    })
  })

  describe('createEquipment', () => {
    it('should create new equipment', async () => {
      const equipmentData = { name: 'New Equipment', category: 'hair' }
      const mockEquipment = { id: '1', ...equipmentData }
      apiClient.post.mockResolvedValue({ data: mockEquipment })

      const result = await equipmentService.createEquipment(equipmentData)

      expect(apiClient.post).toHaveBeenCalledWith('/equipment', equipmentData)
      expect(result).toEqual(mockEquipment)
    })
  })

  describe('updateEquipment', () => {
    it('should update equipment', async () => {
      const updates = { name: 'Updated Equipment' }
      const mockEquipment = { id: '1', name: 'Updated Equipment' }
      apiClient.put.mockResolvedValue({ data: mockEquipment })

      const result = await equipmentService.updateEquipment('1', updates)

      expect(apiClient.put).toHaveBeenCalledWith('/equipment/1', updates)
      expect(result).toEqual(mockEquipment)
    })
  })

  describe('deleteEquipment', () => {
    it('should delete equipment', async () => {
      const mockResponse = { message: 'Deleted' }
      apiClient.delete.mockResolvedValue({ data: mockResponse })

      const result = await equipmentService.deleteEquipment('1')

      expect(apiClient.delete).toHaveBeenCalledWith('/equipment/1')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateEquipmentStatus', () => {
    it('should update equipment status', async () => {
      const mockEquipment = { id: '1', status: 'on_loan' }
      apiClient.patch.mockResolvedValue({ data: mockEquipment })

      const result = await equipmentService.updateEquipmentStatus('1', 'on_loan')

      expect(apiClient.patch).toHaveBeenCalledWith('/equipment/1/status', { status: 'on_loan' })
      expect(result).toEqual(mockEquipment)
    })
  })

  describe('updateEquipmentLocation', () => {
    it('should update equipment location', async () => {
      const mockEquipment = { id: '1', current_location_id: 'loc-1' }
      apiClient.patch.mockResolvedValue({ data: mockEquipment })

      const result = await equipmentService.updateEquipmentLocation('1', 'loc-1')

      expect(apiClient.patch).toHaveBeenCalledWith('/equipment/1/location', { locationId: 'loc-1' })
      expect(result).toEqual(mockEquipment)
    })
  })
})
