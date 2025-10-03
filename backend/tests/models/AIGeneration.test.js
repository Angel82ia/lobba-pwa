import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as AIGeneration from '../../src/models/AIGeneration.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js')

describe('AIGeneration Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createGeneration', () => {
    it('should create new AI generation', async () => {
      const mockGeneration = {
        id: 'gen-1',
        user_id: 'user-1',
        type: 'nails',
        prompt: 'Pink nails with flowers',
        output_image_url: '/uploads/ai/image.png',
        ai_provider: 'mock',
        generation_time_ms: 1000
      }

      pool.query.mockResolvedValue({ rows: [mockGeneration] })

      const result = await AIGeneration.createGeneration({
        userId: 'user-1',
        type: 'nails',
        prompt: 'Pink nails with flowers',
        inputImageUrl: null,
        outputImageUrl: '/uploads/ai/image.png',
        styleId: null,
        aiProvider: 'mock',
        generationTimeMs: 1000
      })

      expect(result).toEqual(mockGeneration)
    })
  })

  describe('findGenerationsByUserId', () => {
    it('should find generations by user ID', async () => {
      const mockGenerations = [
        { id: 'gen-1', type: 'nails', prompt: 'Test 1' },
        { id: 'gen-2', type: 'hairstyle', prompt: null }
      ]

      pool.query.mockResolvedValue({ rows: mockGenerations })

      const result = await AIGeneration.findGenerationsByUserId('user-1')

      expect(result).toEqual(mockGenerations)
    })

    it('should filter by type', async () => {
      const mockGenerations = [
        { id: 'gen-1', type: 'nails', prompt: 'Test 1' }
      ]

      pool.query.mockResolvedValue({ rows: mockGenerations })

      const result = await AIGeneration.findGenerationsByUserId('user-1', { type: 'nails' })

      expect(result).toEqual(mockGenerations)
    })
  })
})
