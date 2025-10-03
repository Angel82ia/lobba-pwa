import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as itemService from './item'
import apiClient from './api'

vi.mock('./api')

describe('Item Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllItems', () => {
    it('should get all items with filters', async () => {
      const mockItems = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ]
      apiClient.get.mockResolvedValue({ data: mockItems })

      const result = await itemService.getAllItems(1, 20, 'hygiene', true)

      expect(apiClient.get).toHaveBeenCalledWith('/items', {
        params: { page: 1, limit: 20, category: 'hygiene', isActive: true }
      })
      expect(result).toEqual(mockItems)
    })
  })

  describe('getItemById', () => {
    it('should get item by id', async () => {
      const mockItem = { id: '1', name: 'Test Item' }
      apiClient.get.mockResolvedValue({ data: mockItem })

      const result = await itemService.getItemById('1')

      expect(apiClient.get).toHaveBeenCalledWith('/items/1')
      expect(result).toEqual(mockItem)
    })
  })

  describe('checkStock', () => {
    it('should check item stock', async () => {
      const mockStock = { stock: 50 }
      apiClient.get.mockResolvedValue({ data: mockStock })

      const result = await itemService.checkStock('1')

      expect(apiClient.get).toHaveBeenCalledWith('/items/1/stock')
      expect(result).toEqual(mockStock)
    })
  })

  describe('createItem', () => {
    it('should create a new item', async () => {
      const itemData = { name: 'New Item', category: 'hygiene' }
      const mockItem = { id: '1', ...itemData }
      apiClient.post.mockResolvedValue({ data: mockItem })

      const result = await itemService.createItem(itemData)

      expect(apiClient.post).toHaveBeenCalledWith('/items', itemData)
      expect(result).toEqual(mockItem)
    })
  })

  describe('updateItem', () => {
    it('should update an item', async () => {
      const updates = { name: 'Updated Item' }
      const mockItem = { id: '1', name: 'Updated Item' }
      apiClient.put.mockResolvedValue({ data: mockItem })

      const result = await itemService.updateItem('1', updates)

      expect(apiClient.put).toHaveBeenCalledWith('/items/1', updates)
      expect(result).toEqual(mockItem)
    })
  })

  describe('deleteItem', () => {
    it('should delete an item', async () => {
      const mockResponse = { message: 'Deleted' }
      apiClient.delete.mockResolvedValue({ data: mockResponse })

      const result = await itemService.deleteItem('1')

      expect(apiClient.delete).toHaveBeenCalledWith('/items/1')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateStock', () => {
    it('should update item stock', async () => {
      const mockItem = { id: '1', stock_quantity: 100 }
      apiClient.patch.mockResolvedValue({ data: mockItem })

      const result = await itemService.updateStock('1', 100)

      expect(apiClient.patch).toHaveBeenCalledWith('/items/1/stock', { quantity: 100 })
      expect(result).toEqual(mockItem)
    })
  })
})
