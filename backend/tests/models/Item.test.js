import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Item from '../../src/models/Item.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js')

describe('Item Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createItem', () => {
    it('should create a new item', async () => {
      const mockItem = {
        id: '123',
        name: 'Test Item',
        description: 'Test description',
        category: 'hygiene',
        is_consumable: true,
        stock_quantity: 100,
        monthly_limit: 10,
        is_active: true,
        created_at: new Date()
      }

      pool.query.mockResolvedValue({ rows: [mockItem] })

      const result = await Item.createItem({
        name: 'Test Item',
        description: 'Test description',
        category: 'hygiene',
        isConsumable: true,
        stockQuantity: 100,
        monthlyLimit: 10
      })

      expect(result).toEqual(mockItem)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO items'),
        expect.any(Array)
      )
    })
  })

  describe('findAllItems', () => {
    it('should find all items with filters', async () => {
      const mockItems = [
        { id: '1', name: 'Item 1', category: 'hygiene' },
        { id: '2', name: 'Item 2', category: 'beauty' }
      ]

      pool.query.mockResolvedValue({ rows: mockItems })

      const result = await Item.findAllItems({ page: 1, limit: 20, category: 'hygiene' })

      expect(result).toEqual(mockItems)
      expect(pool.query).toHaveBeenCalled()
    })
  })

  describe('findItemById', () => {
    it('should find an item by id', async () => {
      const mockItem = {
        id: '123',
        name: 'Test Item',
        category: 'hygiene'
      }

      pool.query.mockResolvedValue({ rows: [mockItem] })

      const result = await Item.findItemById('123')

      expect(result).toEqual(mockItem)
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM items WHERE id = $1',
        ['123']
      )
    })
  })

  describe('updateItem', () => {
    it('should update an item', async () => {
      const mockItem = {
        id: '123',
        name: 'Updated Item'
      }

      pool.query.mockResolvedValue({ rows: [mockItem] })

      const result = await Item.updateItem('123', { name: 'Updated Item' })

      expect(result).toEqual(mockItem)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE items'),
        expect.any(Array)
      )
    })
  })

  describe('deleteItem', () => {
    it('should soft delete an item', async () => {
      const mockItem = { id: '123', is_active: false }

      pool.query.mockResolvedValue({ rows: [mockItem] })

      const result = await Item.deleteItem('123')

      expect(result).toEqual(mockItem)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE items'),
        expect.any(Array)
      )
    })
  })

  describe('updateStock', () => {
    it('should update item stock quantity', async () => {
      const mockItem = { id: '123', stock_quantity: 50 }

      pool.query.mockResolvedValue({ rows: [mockItem] })

      const result = await Item.updateStock('123', 50)

      expect(result).toEqual(mockItem)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('stock_quantity'),
        [50, '123']
      )
    })
  })

  describe('checkStock', () => {
    it('should return current stock quantity', async () => {
      pool.query.mockResolvedValue({ rows: [{ stock_quantity: 75 }] })

      const result = await Item.checkStock('123')

      expect(result).toBe(75)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT stock_quantity'),
        ['123']
      )
    })
  })
})
