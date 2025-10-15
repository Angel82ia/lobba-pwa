import rateLimit from 'express-rate-limit'
import { rateLimitConfig, rateLimitPresets } from '../config/rateLimitConfig.js'

const createLimiter = preset => {
  return rateLimit({
    ...rateLimitConfig,
    ...preset,
  })
}

export const generalLimiter = createLimiter(rateLimitPresets.general)
export const authLimiter = createLimiter(rateLimitPresets.auth)
export const aiGenerationLimiter = createLimiter(rateLimitPresets.aiGeneration)
export const paymentLimiter = createLimiter(rateLimitPresets.payment)
export const deviceValidationLimiter = createLimiter(rateLimitPresets.deviceValidation)
export const adminLimiter = createLimiter(rateLimitPresets.admin)
export const chatbotLimiter = createLimiter(rateLimitPresets.chatbot)
