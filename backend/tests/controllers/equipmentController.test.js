import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as equipmentController from '../../src/controllers/equipmentController.js'
import * as Equipment from '../../src/models/Equipment.js'

vi.mock('../../src/models/Equipment.js')

describe('Equipment Controller', () => {
  let req, res

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-1', role: 'admin' }
    }
    res = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis()
    }
    vi.clearAllMocks()
  })

  describe('getAllEquipment', () => {
    it('should get all equipment with filters', async () => {
      req.query = { page: 1, limit: 20, status: 'available' }
      const mockEquipment = [
        { id: '1', name: 'Equipment 1' },
        { id: '2', name: 'Equipment 2' }
      ]
      Equipment.findAllEquipment.mockResolvedValue(mockEquipment)

      await equipmentController.getAllEquipment(req, res)

      expect(Equipment.findAllEquipment).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        status: 'available',
        category: null,
        isActive: true
      })
      expect(res.json).toHaveBeenCalledWith(mockEquipment)
    })
  })

  describe('getEquipmentById', () => {
    it('should get equipment by id', async () => {
      req.params = { id: 'equip-1' }
      const mockEquipment = { id: 'equip-1', name: 'Test Equipment' }
      Equipment.findEquipmentById.mockResolvedValue(mockEquipment)

      await equipmentController.getEquipmentById(req, res)

      expect(Equipment.findEquipmentById).toHaveBeenCalledWith('equip-1')
      expect(res.json).toHaveBeenCalledWith(mockEquipment)
    })

    it('should return 404 if equipment not found', async () => {
      req.params = { id: 'equip-1' }
      Equipment.findEquipmentById.mockResolvedValue(null)

      await equipmentController.getEquipmentById(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Equipo no encontrado'
      })
    })
  })

  describe('getAvailableEquipment', () => {
    it('should get available equipment', async () => {
      const mockEquipment = [{ id: '1', status: 'available' }]
      Equipment.findAvailableEquipment.mockResolvedValue(mockEquipment)

      await equipmentController.getAvailableEquipment(req, res)

      expect(Equipment.findAvailableEquipment).toHaveBeenCalledWith(null)
      expect(res.json).toHaveBeenCalledWith(mockEquipment)
    })
  })

  describe('createEquipment', () => {
    it('should create new equipment as admin', async () => {
      req.body = {
        name: 'New Equipment',
        description: 'Test',
        category: 'hair',
        requiresReturn: true
      }
      const mockEquipment = { id: '123', ...req.body }
      Equipment.createEquipment.mockResolvedValue(mockEquipment)

      await equipmentController.createEquipment(req, res)

      expect(Equipment.createEquipment).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockEquipment)
    })

    it('should return 403 if not admin', async () => {
      req.user.role = 'user'

      await equipmentController.createEquipment(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('should return 400 if name is missing', async () => {
      req.body = { description: 'Test' }

      await equipmentController.createEquipment(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'El nombre es requerido'
      })
    })
  })

  describe('updateEquipment', () => {
    it('should update equipment as admin', async () => {
      req.params = { id: 'equip-1' }
      req.body = { name: 'Updated Equipment' }
      const mockEquipment = { id: 'equip-1', name: 'Updated Equipment' }
      Equipment.updateEquipment.mockResolvedValue(mockEquipment)

      await equipmentController.updateEquipment(req, res)

      expect(Equipment.updateEquipment).toHaveBeenCalledWith('equip-1', req.body)
      expect(res.json).toHaveBeenCalledWith(mockEquipment)
    })

    it('should return 404 if equipment not found', async () => {
      req.params = { id: 'equip-1' }
      Equipment.updateEquipment.mockResolvedValue(null)

      await equipmentController.updateEquipment(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })
  })

  describe('deleteEquipment', () => {
    it('should delete equipment as admin', async () => {
      req.params = { id: 'equip-1' }
      const mockEquipment = { id: 'equip-1' }
      Equipment.deleteEquipment.mockResolvedValue(mockEquipment)

      await equipmentController.deleteEquipment(req, res)

      expect(Equipment.deleteEquipment).toHaveBeenCalledWith('equip-1')
      expect(res.json).toHaveBeenCalledWith({
        message: 'Equipo eliminado correctamente'
      })
    })

    it('should return 403 if not admin', async () => {
      req.user.role = 'user'

      await equipmentController.deleteEquipment(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })
  })

  describe('updateEquipmentStatus', () => {
    it('should update equipment status as admin', async () => {
      req.params = { id: 'equip-1' }
      req.body = { status: 'on_loan' }
      const mockEquipment = { id: 'equip-1', status: 'on_loan' }
      Equipment.updateEquipmentStatus.mockResolvedValue(mockEquipment)

      await equipmentController.updateEquipmentStatus(req, res)

      expect(Equipment.updateEquipmentStatus).toHaveBeenCalledWith('equip-1', 'on_loan')
      expect(res.json).toHaveBeenCalledWith(mockEquipment)
    })

    it('should allow device role to update status', async () => {
      req.user.role = 'device'
      req.params = { id: 'equip-1' }
      req.body = { status: 'on_loan' }
      const mockEquipment = { id: 'equip-1', status: 'on_loan' }
      Equipment.updateEquipmentStatus.mockResolvedValue(mockEquipment)

      await equipmentController.updateEquipmentStatus(req, res)

      expect(res.json).toHaveBeenCalledWith(mockEquipment)
    })

    it('should return 400 if status is missing', async () => {
      req.params = { id: 'equip-1' }
      req.body = {}

      await equipmentController.updateEquipmentStatus(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if status is invalid', async () => {
      req.params = { id: 'equip-1' }
      req.body = { status: 'invalid_status' }

      await equipmentController.updateEquipmentStatus(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Estado inválido'
      })
    })
  })

  describe('updateEquipmentLocation', () => {
    it('should update equipment location', async () => {
      req.params = { id: 'equip-1' }
      req.body = { locationId: 'loc-123' }
      const mockEquipment = { id: 'equip-1', current_location_id: 'loc-123' }
      Equipment.updateEquipmentLocation.mockResolvedValue(mockEquipment)

      await equipmentController.updateEquipmentLocation(req, res)

      expect(Equipment.updateEquipmentLocation).toHaveBeenCalledWith('equip-1', 'loc-123')
      expect(res.json).toHaveBeenCalledWith(mockEquipment)
    })

    it('should return 403 if not admin or device', async () => {
      req.user.role = 'user'

      await equipmentController.updateEquipmentLocation(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })
  })
})
