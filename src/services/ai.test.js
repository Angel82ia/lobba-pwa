import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as aiService from './ai'
import apiClient from './api'

vi.mock('./api')

describe('AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateNailDesign', () => {
    it('should generate nail design', async () => {
      const mockResponse = {
        generation: { id: 'gen-1', output_image_url: '/image.png' },
        quota: { remaining: 99 }
      }

      apiClient.post.mockResolvedValue({ data: mockResponse })

      const result = await aiService.generateNailDesign('Pink nails')

      expect(apiClient.post).toHaveBeenCalledWith('/ai/generate-nails', { prompt: 'Pink nails' })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('generateHairstyle', () => {
    it('should generate hairstyle', async () => {
      const mockResponse = {
        generation: { id: 'gen-1', output_image_url: '/image.png' },
        quota: { remaining: 3 }
      }

      apiClient.post.mockResolvedValue({ data: mockResponse })

      const result = await aiService.generateHairstyle('base64data', 'style-001')

      expect(apiClient.post).toHaveBeenCalledWith('/ai/generate-hairstyle', {
        selfieBase64: 'base64data',
        styleId: 'style-001'
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getMyDesigns', () => {
    it('should fetch user designs', async () => {
      const mockDesigns = [{ id: 'design-1', title: 'My Design' }]
      apiClient.get.mockResolvedValue({ data: mockDesigns })

      const result = await aiService.getMyDesigns(1, 20)

      expect(apiClient.get).toHaveBeenCalledWith('/ai/my-designs', {
        params: { page: 1, limit: 20 }
      })
      expect(result).toEqual(mockDesigns)
    })
  })

  describe('getQuota', () => {
    it('should fetch user quota', async () => {
      const mockQuota = {
        nails: { remaining: 50 },
        hairstyle: { remaining: 2 }
      }
      apiClient.get.mockResolvedValue({ data: mockQuota })

      const result = await aiService.getQuota()

      expect(apiClient.get).toHaveBeenCalledWith('/ai/quota')
      expect(result).toEqual(mockQuota)
    })
  })

  describe('requestSpeechRecognition', () => {
    it('should reject when speech recognition not supported', async () => {
      await expect(aiService.requestSpeechRecognition()).rejects.toThrow('Speech recognition not supported')
    })
  })
})
