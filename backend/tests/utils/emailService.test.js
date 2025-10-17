import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as emailService from '../../src/utils/emailService.js'

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(() => Promise.resolve({ messageId: 'test-message-id' })),
    })),
  },
}))

vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.EMAIL_HOST = 'smtp.test.com'
    process.env.EMAIL_USER = 'test@test.com'
    process.env.EMAIL_PASS = 'testpass'
    process.env.EMAIL_FROM_NAME = 'Test LOBBA'
  })

  describe('sendEmail', () => {
    it('should send email with correct parameters', async () => {
      const emailData = {
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      }

      const result = await emailService.sendEmail(emailData)
      expect(result).toHaveProperty('messageId')
    })

    it('should skip email when configuration is missing', async () => {
      delete process.env.EMAIL_HOST
      delete process.env.EMAIL_USER
      delete process.env.EMAIL_PASS

      const result = await emailService.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      })

      expect(result.status).toBe('skipped')
    })
  })

  describe('sendReservationConfirmationEmail', () => {
    it('should send confirmation email with reservation details', async () => {
      const reservation = {
        client_email: 'client@example.com',
        start_time: new Date('2025-10-20T10:00:00'),
        first_name: 'Juan',
        salon_profile: { business_name: 'Beauty Salon' },
        service: { name: 'Haircut' },
      }

      const result = await emailService.sendReservationConfirmationEmail(reservation)
      expect(result).toHaveProperty('messageId')
    })

    it('should return null when client email is missing', async () => {
      const reservation = {
        start_time: new Date(),
        salon_profile: { business_name: 'Beauty Salon' },
        service: { name: 'Haircut' },
      }

      const result = await emailService.sendReservationConfirmationEmail(reservation)
      expect(result).toBeNull()
    })
  })

  describe('sendReservationCancellationEmail', () => {
    it('should send cancellation email with reason', async () => {
      const reservation = {
        client_email: 'client@example.com',
        first_name: 'Juan',
        salon_profile: { business_name: 'Beauty Salon' },
        cancellation_reason: 'Client request',
      }

      const result = await emailService.sendReservationCancellationEmail(reservation)
      expect(result).toHaveProperty('messageId')
    })

    it('should return null when client email is missing', async () => {
      const reservation = {
        salon_profile: { business_name: 'Beauty Salon' },
      }

      const result = await emailService.sendReservationCancellationEmail(reservation)
      expect(result).toBeNull()
    })
  })

  describe('sendReservationReminderEmail', () => {
    it('should send reminder email', async () => {
      const reservation = {
        client_email: 'client@example.com',
        start_time: new Date('2025-10-21T14:00:00'),
        first_name: 'Maria',
        salon_profile: { business_name: 'Beauty Salon' },
        service: { name: 'Manicure' },
      }

      const result = await emailService.sendReservationReminderEmail(reservation)
      expect(result).toHaveProperty('messageId')
    })
  })

  describe('sendNewReservationToSalonEmail', () => {
    it('should send new reservation notification to salon', async () => {
      const reservation = {
        start_time: new Date('2025-10-20T10:00:00'),
        first_name: 'Carlos',
        last_name: 'García',
        client_phone: '+34123456789',
        notes: 'First time client',
        service: { name: 'Haircut' },
      }

      const result = await emailService.sendNewReservationToSalonEmail(reservation, 'salon@example.com')
      expect(result).toHaveProperty('messageId')
    })

    it('should return null when salon email is not provided', async () => {
      const reservation = {
        start_time: new Date(),
        service: { name: 'Haircut' },
      }

      const result = await emailService.sendNewReservationToSalonEmail(reservation, null)
      expect(result).toBeNull()
    })
  })
})
