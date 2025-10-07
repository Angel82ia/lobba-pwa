import rateLimit from 'express-rate-limit'

const skipInTest = process.env.NODE_ENV === 'test'

export const generalLimiter = skipInTest 
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false
    })

export const authLimiter = skipInTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: 'Too many login attempts, please try again later',
      standardHeaders: true,
      legacyHeaders: false
    })

export const aiGenerationLimiter = skipInTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      message: 'Too many AI generation requests, please slow down',
      keyGenerator: (req) => req.user?.id || 'anonymous',
      standardHeaders: true,
      legacyHeaders: false
    })

export const paymentLimiter = skipInTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000,
      max: 5,
      message: 'Too many payment requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false
    })

export const deviceValidationLimiter = skipInTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000,
      max: 30,
      message: 'Too many validation requests, please slow down',
      keyGenerator: (req) => req.body?.deviceId || 'anonymous',
      standardHeaders: true,
      legacyHeaders: false
    })

export const adminLimiter = skipInTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      message: 'Too many admin requests, please slow down',
      standardHeaders: true,
      legacyHeaders: false
    })

export const chatbotLimiter = skipInTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000,
      max: 20,
      message: 'Too many chatbot messages, please slow down',
      keyGenerator: (req) => req.user?.id || 'anonymous',
      standardHeaders: true,
      legacyHeaders: false
    })
