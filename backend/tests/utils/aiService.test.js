import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initializeAIProvider, generateNailDesign, generateHairstyleTryOn, resetAIProvider } from '../../src/utils/aiService.js'

describe('AI Service', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    resetAIProvider()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('initializeAIProvider', () => {
    it('should default to mock provider when no config', () => {
      delete process.env.AI_PROVIDER
      delete process.env.AI_API_KEY

      const provider = initializeAIProvider()

      expect(provider).toBe('mock')
    })

    it('should use mock when API key is missing', () => {
      process.env.AI_PROVIDER = 'openai'
      delete process.env.AI_API_KEY

      const provider = initializeAIProvider()

      expect(provider).toBe('mock')
    })

    it('should use configured provider when API key exists', () => {
      process.env.AI_PROVIDER = 'stability_ai'
      process.env.AI_API_KEY = 'test-key'

      const provider = initializeAIProvider()

      expect(provider).toBe('stability_ai')
    })
  })

  describe('generateNailDesign', () => {
    it('should generate nail design in mock mode', async () => {
      const result = await generateNailDesign('Pink nails with flowers')

      expect(result).toHaveProperty('imageUrl')
      expect(result).toHaveProperty('provider', 'mock')
      expect(result).toHaveProperty('generationTimeMs')
      expect(result.imageUrl).toContain('placeholder')
    })
  })

  describe('generateHairstyleTryOn', () => {
    it('should generate hairstyle try-on in mock mode', async () => {
      const selfieBase64 = 'data:image/png;base64,test'
      const result = await generateHairstyleTryOn(selfieBase64, 'style-001')

      expect(result).toHaveProperty('imageUrl')
      expect(result).toHaveProperty('provider', 'mock')
      expect(result).toHaveProperty('generationTimeMs')
      expect(result.imageUrl).toContain('placeholder')
    })
  })
})
