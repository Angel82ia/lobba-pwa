import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as itemController from '../../src/controllers/itemController.js'
import * as Item from '../../src/models/Item.js'

vi.mock('../../src/models/Item.js')

describe('Item Controller', () => {
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

  describe('getAllItems', () => {
    it('should get all items with filters', async () => {
      req.query = { page: 1, limit: 20, category: 'hygiene' }
      const mockItems = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ]
      Item.findAllItems.mockResolvedValue(mockItems)

      await itemController.getAllItems(req, res)

      expect(Item.findAllItems).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        category: 'hygiene',
        isActive: true
      })
      expect(res.json).toHaveBeenCalledWith(mockItems)
    })
  })

  describe('getItemById', () => {
    it('should get item by id', async () => {
      req.params = { id: 'item-1' }
      const mockItem = { id: 'item-1', name: 'Test Item' }
      Item.findItemById.mockResolvedValue(mockItem)

      await itemController.getItemById(req, res)

      expect(Item.findItemById).toHaveBeenCalledWith('item-1')
      expect(res.json).toHaveBeenCalledWith(mockItem)
    })

    it('should return 404 if item not found', async () => {
      req.params = { id: 'item-1' }
      Item.findItemById.mockResolvedValue(null)

      await itemController.getItemById(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Artículo no encontrado'
      })
    })
  })

  describe('createItem', () => {
    it('should create a new item as admin', async () => {
      req.body = {
        name: 'New Item',
        description: 'Test description',
        category: 'hygiene',
        stockQuantity: 100
      }
      const mockItem = { id: '123', ...req.body }
      Item.createItem.mockResolvedValue(mockItem)

      await itemController.createItem(req, res)

      expect(Item.createItem).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockItem)
    })

    it('should return 403 if not admin', async () => {
      req.user.role = 'user'

      await itemController.createItem(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Acceso de administrador requerido'
      })
    })

    it('should return 400 if name is missing', async () => {
      req.body = { description: 'Test' }

      await itemController.createItem(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'El nombre es requerido'
      })
    })
  })

  describe('updateItem', () => {
    it('should update an item as admin', async () => {
      req.params = { id: 'item-1' }
      req.body = { name: 'Updated Item' }
      const mockItem = { id: 'item-1', name: 'Updated Item' }
      Item.updateItem.mockResolvedValue(mockItem)

      await itemController.updateItem(req, res)

      expect(Item.updateItem).toHaveBeenCalledWith('item-1', req.body)
      expect(res.json).toHaveBeenCalledWith(mockItem)
    })

    it('should return 403 if not admin', async () => {
      req.user.role = 'user'
      req.params = { id: 'item-1' }

      await itemController.updateItem(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('should return 404 if item not found', async () => {
      req.params = { id: 'item-1' }
      Item.updateItem.mockResolvedValue(null)

      await itemController.updateItem(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })
  })

  describe('deleteItem', () => {
    it('should delete an item as admin', async () => {
      req.params = { id: 'item-1' }
      const mockItem = { id: 'item-1' }
      Item.deleteItem.mockResolvedValue(mockItem)

      await itemController.deleteItem(req, res)

      expect(Item.deleteItem).toHaveBeenCalledWith('item-1')
      expect(res.json).toHaveBeenCalledWith({
        message: 'Artículo eliminado correctamente'
      })
    })

    it('should return 403 if not admin', async () => {
      req.user.role = 'user'

      await itemController.deleteItem(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })
  })

  describe('updateStock', () => {
    it('should update item stock as admin', async () => {
      req.params = { id: 'item-1' }
      req.body = { quantity: 50 }
      const mockItem = { id: 'item-1', stock_quantity: 50 }
      Item.updateStock.mockResolvedValue(mockItem)

      await itemController.updateStock(req, res)

      expect(Item.updateStock).toHaveBeenCalledWith('item-1', 50)
      expect(res.json).toHaveBeenCalledWith(mockItem)
    })

    it('should return 400 if quantity is missing', async () => {
      req.params = { id: 'item-1' }
      req.body = {}

      await itemController.updateStock(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'La cantidad es requerida'
      })
    })
  })

  describe('checkStock', () => {
    it('should return current stock level', async () => {
      req.params = { id: 'item-1' }
      Item.checkStock.mockResolvedValue(75)

      await itemController.checkStock(req, res)

      expect(Item.checkStock).toHaveBeenCalledWith('item-1')
      expect(res.json).toHaveBeenCalledWith({ stock: 75 })
    })
  })
})
