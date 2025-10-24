import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  validateSecrets,
  sanitizeError,
  hasSecret,
  getSecret,
  getFeatureStatus,
} from '../../src/config/secrets.js'

describe('Secrets Configuration', () => {
  let originalEnv

  beforeEach(() => {
    // Guardar env original
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    // Restaurar env
    process.env = originalEnv
  })

  describe('validateSecrets', () => {
    it('should pass validation when all critical secrets are present', () => {
      process.env.JWT_SECRET = 'test_jwt_secret'
      process.env.DATABASE_URL = 'postgres://test'
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.NODE_ENV = 'test'

      const result = validateSecrets()
      expect(result.valid).toBe(true)
    })

    it('should throw error when critical secrets are missing in production', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.JWT_SECRET

      expect(() => validateSecrets()).toThrow('Missing required secrets')
    })

    it('should not throw in test mode even with missing secrets', () => {
      process.env.NODE_ENV = 'test'
      delete process.env.JWT_SECRET

      const result = validateSecrets()
      expect(result.valid).toBe(true)
    })

    it('should warn about missing optional secrets', () => {
      process.env.JWT_SECRET = 'test'
      process.env.DATABASE_URL = 'postgres://test'
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.NODE_ENV = 'test'
      delete process.env.SMTP_HOST

      const result = validateSecrets()
      expect(result.warnings).toContain('SMTP_HOST')
    })
  })

  describe('sanitizeError', () => {
    it('should redact Stripe secret keys from error messages', () => {
      const error = new Error('Failed with key sk_live_1234567890abcdef')
      const sanitized = sanitizeError(error, 'stripe')

      expect(sanitized.message).not.toContain('sk_live_')
      expect(sanitized.message).toContain('[REDACTED]')
      expect(sanitized.context).toBe('stripe')
    })

    it('should redact Bearer tokens from error messages', () => {
      const error = new Error('Auth failed: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
      const sanitized = sanitizeError(error, 'auth')

      expect(sanitized.message).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
      expect(sanitized.message).toContain('[REDACTED]')
    })

    it('should preserve error type and code', () => {
      const error = new Error('Test error')
      error.type = 'StripeAPIError'
      error.code = 'invalid_request'
      error.statusCode = 400

      const sanitized = sanitizeError(error, 'stripe')

      expect(sanitized.type).toBe('StripeAPIError')
      expect(sanitized.code).toBe('invalid_request')
      expect(sanitized.statusCode).toBe(400)
    })

    it('should redact long tokens', () => {
      const error = new Error('Token: ' + 'a'.repeat(50))
      const sanitized = sanitizeError(error, 'test')

      expect(sanitized.message).toContain('[REDACTED]')
    })
  })

  describe('hasSecret', () => {
    it('should return true for existing secret', () => {
      process.env.TEST_SECRET = 'value'
      expect(hasSecret('TEST_SECRET')).toBe(true)
    })

    it('should return false for missing secret', () => {
      delete process.env.TEST_SECRET
      expect(hasSecret('TEST_SECRET')).toBe(false)
    })

    it('should return false for undefined string', () => {
      process.env.TEST_SECRET = 'undefined'
      expect(hasSecret('TEST_SECRET')).toBe(false)
    })
  })

  describe('getSecret', () => {
    it('should return secret value', () => {
      process.env.TEST_SECRET = 'my_value'
      expect(getSecret('TEST_SECRET')).toBe('my_value')
    })

    it('should return default value if secret missing', () => {
      delete process.env.TEST_SECRET
      expect(getSecret('TEST_SECRET', 'default')).toBe('default')
    })

    it('should throw error if secret missing and no default', () => {
      delete process.env.TEST_SECRET
      expect(() => getSecret('TEST_SECRET')).toThrow('Secret TEST_SECRET is not configured')
    })
  })

  describe('getFeatureStatus', () => {
    it('should return correct feature status', () => {
      process.env.SMTP_HOST = 'smtp.test.com'
      process.env.SMTP_USER = 'test@test.com'
      process.env.FIREBASE_PROJECT_ID = 'test-project'
      process.env.FIREBASE_PRIVATE_KEY = 'test-key'
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      delete process.env.TWILIO_ACCOUNT_SID

      const status = getFeatureStatus()

      expect(status.email).toBe(true)
      expect(status.push).toBe(true)
      expect(status.stripe).toBe(true)
      expect(status.whatsapp).toBe(true) // wa.me links siempre disponibles
    })
  })
})
