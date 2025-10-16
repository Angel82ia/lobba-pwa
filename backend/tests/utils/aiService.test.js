import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  initializeAIProvider,
  generateNailDesign,
  generateHairstyleTryOn,
  generateChatbotResponse,
  resetAIProvider,
} from '../../src/utils/aiService.js'

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

    it('should use mock provider in test environment even with API key', () => {
      process.env.AI_PROVIDER = 'stability_ai'
      process.env.AI_API_KEY = 'test-key'
      process.env.NODE_ENV = 'test'

      const provider = initializeAIProvider()

      expect(provider).toBe('mock')
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

  describe('generateChatbotResponse', () => {
    it('should generate chatbot response with mock provider', async () => {
      process.env.AI_PROVIDER = 'mock'
      resetAIProvider()

      const result = await generateChatbotResponse('Hello Olivia')

      expect(result).toHaveProperty('response')
      expect(result).toHaveProperty('provider', 'mock')
      expect(result.response).toContain('Hola, soy Olivia')
      expect(result.response).toContain('Hello Olivia')
    })

    it('should include conversation history in context', async () => {
      process.env.AI_PROVIDER = 'mock'
      resetAIProvider()

      const history = [
        { sender_type: 'user', content: 'Previous question' },
        { sender_type: 'bot', content: 'Previous answer' },
      ]

      const result = await generateChatbotResponse('Follow up question', history)

      expect(result).toHaveProperty('response')
      expect(result).toHaveProperty('provider', 'mock')
    })

    it('should use mock provider in test environment', async () => {
      process.env.AI_PROVIDER = 'stability_ai'
      process.env.AI_API_KEY = 'test-key'
      process.env.NODE_ENV = 'test'
      resetAIProvider()

      const result = await generateChatbotResponse('Hello')

      expect(result).toHaveProperty('response')
      expect(result).toHaveProperty('provider', 'mock')
    })
  })
})
