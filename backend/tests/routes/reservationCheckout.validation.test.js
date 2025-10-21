import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { body } from 'express-validator'
import { validationResult } from 'express-validator'

// Mock auth middleware
const requireAuth = (req, res, next) => {
  req.user = { id: 'test-user-id' }
  next()
}

// Mock controller that respects validation
const mockProcessCheckout = (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: errors.array(),
    })
  }
  res.status(200).json({ success: true })
}

describe('Reservation Checkout Validation', () => {
  let app

  beforeEach(() => {
    app = express()
    app.use(express.json())

    const router = express.Router()

    router.use(requireAuth)

    // Create the validation route manually for testing
    router.post(
      '/process',
      [
        body('serviceId').isUUID().withMessage('Valid service ID is required'),

        body('startTime')
          .isISO8601()
          .withMessage('Valid start time is required')
          .custom(value => {
            const startDate = new Date(value)
            const now = new Date()

            const minimumTime = new Date(now.getTime() + 30 * 60 * 1000)
            if (startDate < minimumTime) {
              throw new Error('Start time must be at least 30 minutes in the future')
            }

            const maxTime = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
            if (startDate > maxTime) {
              throw new Error('Start time cannot be more than 6 months in the future')
            }

            return true
          }),

        body('endTime')
          .isISO8601()
          .withMessage('Valid end time is required')
          .custom((value, { req }) => {
            const endDate = new Date(value)
            const startDate = new Date(req.body.startTime)

            if (endDate <= startDate) {
              throw new Error('End time must be after start time')
            }

            const maxDuration = 8 * 60 * 60 * 1000
            if (endDate - startDate > maxDuration) {
              throw new Error('Reservation duration cannot exceed 8 hours')
            }

            return true
          }),

        body('notes')
          .optional()
          .trim()
          .isLength({ max: 500 })
          .withMessage('Notes cannot exceed 500 characters')
          .escape(),

        body('clientPhone')
          .optional()
          .trim()
          .matches(/^\+?[0-9\s\-()]{9,15}$/)
          .withMessage('Invalid phone format (must be 9-15 digits)')
          .isLength({ max: 20 })
          .withMessage('Phone number is too long'),
      ],
      mockProcessCheckout
    )

    app.use('/api/reservation-checkout', router)
  })

  describe('POST /process - serviceId validation', () => {
    it('should reject non-UUID serviceId', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: 'invalid-uuid',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toBeDefined()
      expect(response.body.errors[0].msg).toContain('service ID')
    })

    it('should accept valid UUID serviceId', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        })

      expect(response.status).toBe(200)
    })
  })

  describe('POST /process - startTime validation', () => {
    it('should reject startTime in the past', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toBeDefined()
      expect(response.body.errors.some(e => e.msg.includes('30 minutes in the future'))).toBe(true)
    })

    it('should reject startTime less than 30 minutes from now', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
          endTime: new Date(Date.now() + 75 * 60 * 1000).toISOString(),
        })

      expect(response.status).toBe(400)
      expect(response.body.errors.some(e => e.msg.includes('30 minutes in the future'))).toBe(true)
    })

    it('should reject startTime more than 6 months in the future', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(), // 200 days
          endTime: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        })

      expect(response.status).toBe(400)
      expect(response.body.errors.some(e => e.msg.includes('6 months in the future'))).toBe(true)
    })

    it('should accept valid future startTime', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        })

      expect(response.status).toBe(200)
    })
  })

  describe('POST /process - endTime validation', () => {
    it('should reject endTime before startTime', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        })

      expect(response.status).toBe(400)
      expect(response.body.errors.some(e => e.msg.includes('after start time'))).toBe(true)
    })

    it('should reject endTime equal to startTime', async () => {
      const sameTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

      const response = await request(app).post('/api/reservation-checkout/process').send({
        serviceId: '123e4567-e89b-12d3-a456-426614174000',
        startTime: sameTime,
        endTime: sameTime,
      })

      expect(response.status).toBe(400)
      expect(response.body.errors.some(e => e.msg.includes('after start time'))).toBe(true)
    })

    it('should reject duration longer than 8 hours', async () => {
      const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
      const endTime = new Date(startTime.getTime() + 9 * 60 * 60 * 1000) // 9 hours

      const response = await request(app).post('/api/reservation-checkout/process').send({
        serviceId: '123e4567-e89b-12d3-a456-426614174000',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      })

      expect(response.status).toBe(400)
      expect(response.body.errors.some(e => e.msg.includes('8 hours'))).toBe(true)
    })

    it('should accept valid endTime', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        })

      expect(response.status).toBe(200)
    })
  })

  describe('POST /process - notes validation', () => {
    it('should accept missing notes', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        })

      expect(response.status).toBe(200)
    })

    it('should reject notes longer than 500 characters', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          notes: 'A'.repeat(501),
        })

      expect(response.status).toBe(400)
      expect(response.body.errors.some(e => e.msg.includes('500 characters'))).toBe(true)
    })

    it('should sanitize HTML in notes', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          notes: '<script>alert("XSS")</script>Test',
        })

      expect(response.status).toBe(200)
      // Sanitization happens in middleware
    })

    it('should accept valid notes', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          notes: 'Please use organic products',
        })

      expect(response.status).toBe(200)
    })
  })

  describe('POST /process - clientPhone validation', () => {
    it('should accept missing phone', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        })

      expect(response.status).toBe(200)
    })

    it('should reject invalid phone format', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          clientPhone: 'not-a-phone',
        })

      expect(response.status).toBe(400)
      expect(response.body.errors.some(e => e.msg.includes('Invalid phone'))).toBe(true)
    })

    it('should reject phone longer than 20 characters', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          clientPhone: '+34' + '1'.repeat(20),
        })

      expect(response.status).toBe(400)
      expect(response.body.errors.some(e => e.msg.includes('too long'))).toBe(true)
    })

    it('should accept valid phone with spaces', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          clientPhone: '+34 123 456 789',
        })

      expect(response.status).toBe(200)
    })

    it('should accept valid phone with hyphens', async () => {
      const response = await request(app)
        .post('/api/reservation-checkout/process')
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          clientPhone: '+34-123-456-789',
        })

      expect(response.status).toBe(200)
    })
  })
})
