import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as AICatalog from '../../src/models/AICatalog.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js')

describe('AICatalog Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createCatalogItem', () => {
    it('should create new catalog item', async () => {
      const mockItem = {
        id: 'cat-1',
        type: 'hairstyle',
        style_id: 'style-001',
        name: 'Long Waves',
        preview_image_url: '/images/style.png',
        tags: ['long', 'wavy']
      }

      pool.query.mockResolvedValue({ rows: [mockItem] })

      const result = await AICatalog.createCatalogItem({
        type: 'hairstyle',
        styleId: 'style-001',
        name: 'Long Waves',
        description: 'Beautiful long waves',
        previewImageUrl: '/images/style.png',
        tags: ['long', 'wavy']
      })

      expect(result).toEqual(mockItem)
    })
  })

  describe('findCatalogItems', () => {
    it('should find catalog items with filters', async () => {
      const mockItems = [
        { id: 'cat-1', type: 'hairstyle', name: 'Style 1' },
        { id: 'cat-2', type: 'hairstyle', name: 'Style 2' }
      ]

      pool.query.mockResolvedValue({ rows: mockItems })

      const result = await AICatalog.findCatalogItems({ type: 'hairstyle' })

      expect(result).toEqual(mockItems)
    })
  })

  describe('incrementLikes', () => {
    it('should increment likes count', async () => {
      const mockItem = {
        id: 'cat-1',
        likes_count: 11
      }

      pool.query.mockResolvedValue({ rows: [mockItem] })

      const result = await AICatalog.incrementLikes('cat-1')

      expect(result.likes_count).toBe(11)
    })
  })
})
