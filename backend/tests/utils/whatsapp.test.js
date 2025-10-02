import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('twilio', () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({ sid: 'msg-123' }),
    },
  })),
}))

const {
  sendWhatsAppMessage,
  sendReservationConfirmation,
  sendReservationReminder,
  sendReservationCancellation,
} = await import('../../src/utils/whatsapp.js')

describe('WhatsApp Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendWhatsAppMessage', () => {
    it('should send WhatsApp message with correct parameters', async () => {
      const result = await sendWhatsAppMessage({
        to: '+1234567890',
        body: 'Test message',
      })

      expect(result.sid).toBe('mock-sid')
    })
  })

  describe('sendReservationConfirmation', () => {
    it('should send confirmation message', async () => {
      const reservation = {
        client_phone: '+1234567890',
        start_time: new Date('2025-10-10T10:00:00Z'),
        salon_profile: { business_name: 'Test Salon' },
        service: { name: 'Test Service' },
      }

      const result = await sendReservationConfirmation(reservation)
      expect(result.sid).toBe('mock-sid')
    })
  })

  describe('sendReservationReminder', () => {
    it('should send reminder message', async () => {
      const reservation = {
        client_phone: '+1234567890',
        start_time: new Date('2025-10-10T10:00:00Z'),
        salon_profile: { business_name: 'Test Salon' },
      }

      const result = await sendReservationReminder(reservation)
      expect(result.sid).toBe('mock-sid')
    })
  })

  describe('sendReservationCancellation', () => {
    it('should send cancellation message', async () => {
      const reservation = {
        client_phone: '+1234567890',
        salon_profile: { business_name: 'Test Salon' },
        cancellation_reason: 'Client requested',
      }

      const result = await sendReservationCancellation(reservation)
      expect(result.sid).toBe('mock-sid')
    })
  })
})
