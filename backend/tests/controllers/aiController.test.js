import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as aiController from '../../src/controllers/aiController.js'
import * as UserQuota from '../../src/models/UserQuota.js'
import * as AIGeneration from '../../src/models/AIGeneration.js'
import * as SavedDesign from '../../src/models/SavedDesign.js'
import * as aiService from '../../src/utils/aiService.js'

vi.mock('../../src/models/UserQuota.js')
vi.mock('../../src/models/AIGeneration.js')
vi.mock('../../src/models/SavedDesign.js')
vi.mock('../../src/utils/aiService.js', () => ({
  generateNailDesign: vi.fn(),
  generateHairstyleTryOn: vi.fn(),
  initializeAIProvider: vi.fn(() => 'mock'),
  resetAIProvider: vi.fn(),
}))
vi.mock('../../src/utils/cloudinary.js', () => ({
  uploadToCloudinary: vi.fn().mockResolvedValue({ secure_url: 'https://example.com/image.png' }),
}))
vi.mock('fs/promises')

describe('AI Controller', () => {
  let req, res

  beforeEach(() => {
    vi.clearAllMocks()
    req = {
      user: { id: 'user-123' },
      body: {},
      query: {},
      params: {},
    }
    res = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    }
  })

  describe('generateNails', () => {
    it('should generate nail design successfully', async () => {
      req.body = { prompt: 'Pink nails' }

      UserQuota.checkNailsQuota.mockResolvedValue({
        hasQuota: true,
        used: 50,
        limit: 100,
        remaining: 50,
      })

      aiService.generateNailDesign.mockResolvedValue({
        imageUrl: 'https://example.com/uploads/ai/image.png',
        provider: 'mock',
        generationTimeMs: 1000,
      })

      AIGeneration.createGeneration.mockResolvedValue({
        id: 'gen-1',
        output_image_url: 'https://example.com/uploads/ai/image.png',
      })

      UserQuota.incrementNailsQuota.mockResolvedValue({})
      SavedDesign.createSavedDesign.mockResolvedValue({})

      UserQuota.checkNailsQuota.mockResolvedValue({
        hasQuota: true,
        used: 51,
        limit: 100,
        remaining: 49,
      })

      await aiController.generateNails(req, res)

      expect(res.json).toHaveBeenCalled()
      expect(UserQuota.incrementNailsQuota).toHaveBeenCalled()
    })

    it('should reject when quota exceeded', async () => {
      req.body = { prompt: 'Pink nails' }

      UserQuota.checkNailsQuota.mockResolvedValue({
        hasQuota: false,
        used: 100,
        limit: 100,
        remaining: 0,
      })

      await aiController.generateNails(req, res)

      expect(res.status).toHaveBeenCalledWith(429)
      expect(aiService.generateNailDesign).not.toHaveBeenCalled()
    })

    it('should reject empty prompt', async () => {
      req.body = { prompt: '' }

      await aiController.generateNails(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('generateHairstyle', () => {
    it('should generate hairstyle successfully', async () => {
      req.body = {
        selfieBase64: 'data:image/png;base64,test',
        styleId: 'style-001',
      }

      UserQuota.checkHairstyleQuota.mockResolvedValue({
        hasQuota: true,
        used: 2,
        limit: 4,
        remaining: 2,
      })

      aiService.generateHairstyleTryOn.mockResolvedValue({
        imageUrl: 'https://example.com/uploads/ai/image.png',
        provider: 'mock',
        generationTimeMs: 1500,
      })

      AIGeneration.createGeneration.mockResolvedValue({
        id: 'gen-1',
        output_image_url: 'https://example.com/uploads/ai/image.png',
      })

      UserQuota.incrementHairstyleQuota.mockResolvedValue({})
      SavedDesign.createSavedDesign.mockResolvedValue({})

      UserQuota.checkHairstyleQuota.mockResolvedValue({
        hasQuota: true,
        used: 3,
        limit: 4,
        remaining: 1,
      })

      await aiController.generateHairstyle(req, res)

      expect(res.json).toHaveBeenCalled()
      expect(UserQuota.incrementHairstyleQuota).toHaveBeenCalled()
    })

    it('should reject when quota exceeded', async () => {
      req.body = {
        selfieBase64: 'data:image/png;base64,test',
        styleId: 'style-001',
      }

      UserQuota.checkHairstyleQuota.mockResolvedValue({
        hasQuota: false,
        used: 4,
        limit: 4,
        remaining: 0,
      })

      await aiController.generateHairstyle(req, res)

      expect(res.status).toHaveBeenCalledWith(429)
    })
  })

  describe('getQuota', () => {
    it('should return user quota status', async () => {
      UserQuota.getOrCreateQuota.mockResolvedValue({
        nails_quota_used: 50,
        nails_quota_limit: 100,
        hairstyle_quota_used: 2,
        hairstyle_quota_limit: 4,
      })

      UserQuota.checkNailsQuota.mockResolvedValue({
        hasQuota: true,
        used: 50,
        limit: 100,
        remaining: 50,
      })

      UserQuota.checkHairstyleQuota.mockResolvedValue({
        hasQuota: true,
        used: 2,
        limit: 4,
        remaining: 2,
      })

      await aiController.getQuota(req, res)

      expect(res.json).toHaveBeenCalled()
    })
  })
})
