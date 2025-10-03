import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as DesignRating from '../../src/models/DesignRating.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js')

describe('DesignRating Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createRating', () => {
    it('should create a new rating', async () => {
      const mockRating = {
        id: '123',
        catalog_item_id: 'item-1',
        user_id: 'user-1',
        rating: 5,
        comment: 'Great design!',
        created_at: new Date()
      }

      pool.query.mockResolvedValue({ rows: [mockRating] })

      const result = await DesignRating.createRating({
        catalogItemId: 'item-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Great design!'
      })

      expect(result).toEqual(mockRating)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO design_ratings'),
        ['item-1', 'user-1', 5, 'Great design!']
      )
    })

    it('should throw error for invalid rating', async () => {
      await expect(
        DesignRating.createRating({
          catalogItemId: 'item-1',
          userId: 'user-1',
          rating: 6,
          comment: 'Invalid'
        })
      ).rejects.toThrow('Rating must be between 1 and 5')
    })

    it('should return null on duplicate rating', async () => {
      const error = new Error('Duplicate')
      error.code = '23505'
      pool.query.mockRejectedValue(error)

      const result = await DesignRating.createRating({
        catalogItemId: 'item-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Great'
      })

      expect(result).toBeNull()
    })
  })

  describe('updateRating', () => {
    it('should update a rating', async () => {
      const mockRating = {
        id: '123',
        rating: 4,
        comment: 'Updated comment'
      }

      pool.query.mockResolvedValue({ rows: [mockRating] })

      const result = await DesignRating.updateRating('123', {
        rating: 4,
        comment: 'Updated comment'
      })

      expect(result).toEqual(mockRating)
    })

    it('should throw error for invalid rating on update', async () => {
      await expect(
        DesignRating.updateRating('123', { rating: 0 })
      ).rejects.toThrow('Rating must be between 1 and 5')
    })
  })

  describe('getAverageRating', () => {
    it('should return average rating and count', async () => {
      pool.query.mockResolvedValue({
        rows: [{ average_rating: '4.5', rating_count: '10' }]
      })

      const result = await DesignRating.getAverageRating('item-1')

      expect(result).toEqual({
        averageRating: 4.5,
        ratingCount: 10
      })
    })
  })

  describe('getRatingDistribution', () => {
    it('should return rating distribution', async () => {
      pool.query.mockResolvedValue({
        rows: [
          { rating: 5, count: '10' },
          { rating: 4, count: '5' },
          { rating: 3, count: '2' }
        ]
      })

      const result = await DesignRating.getRatingDistribution('item-1')

      expect(result).toEqual({
        5: 10,
        4: 5,
        3: 2,
        2: 0,
        1: 0
      })
    })
  })

  describe('findRatingsByCatalogItem', () => {
    it('should find ratings for a catalog item', async () => {
      const mockRatings = [
        { id: '1', rating: 5, comment: 'Great!', first_name: 'John' },
        { id: '2', rating: 4, comment: 'Good', first_name: 'Jane' }
      ]

      pool.query.mockResolvedValue({ rows: mockRatings })

      const result = await DesignRating.findRatingsByCatalogItem('item-1')

      expect(result).toEqual(mockRatings)
    })
  })

  describe('findUserRating', () => {
    it('should find user rating for a catalog item', async () => {
      const mockRating = {
        id: '123',
        rating: 5,
        comment: 'Great!'
      }

      pool.query.mockResolvedValue({ rows: [mockRating] })

      const result = await DesignRating.findUserRating('item-1', 'user-1')

      expect(result).toEqual(mockRating)
    })
  })
})
