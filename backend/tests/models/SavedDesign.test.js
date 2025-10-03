import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as SavedDesign from '../../src/models/SavedDesign.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js')

describe('SavedDesign Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createSavedDesign', () => {
    it('should create saved design', async () => {
      const mockDesign = {
        id: 'saved-1',
        user_id: 'user-1',
        generation_id: 'gen-1',
        title: 'My Design',
        is_favorite: false
      }

      pool.query.mockResolvedValue({ rows: [mockDesign] })

      const result = await SavedDesign.createSavedDesign({
        userId: 'user-1',
        generationId: 'gen-1',
        title: 'My Design'
      })

      expect(result).toEqual(mockDesign)
    })
  })

  describe('findSavedDesignsByUserId', () => {
    it('should find saved designs with generation data', async () => {
      const mockDesigns = [
        {
          id: 'saved-1',
          user_id: 'user-1',
          title: 'Design 1',
          type: 'nails',
          output_image_url: '/image.png'
        }
      ]

      pool.query.mockResolvedValue({ rows: mockDesigns })

      const result = await SavedDesign.findSavedDesignsByUserId('user-1')

      expect(result).toEqual(mockDesigns)
    })
  })

  describe('toggleFavorite', () => {
    it('should toggle favorite status', async () => {
      const mockDesign = {
        id: 'saved-1',
        is_favorite: true
      }

      pool.query.mockResolvedValue({ rows: [mockDesign] })

      const result = await SavedDesign.toggleFavorite('saved-1')

      expect(result.is_favorite).toBe(true)
    })
  })
})
