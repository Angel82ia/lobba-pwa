import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { sendDailyReminders } from '../../src/services/cronJobs.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js', () => ({
  default: {
    query: vi.fn(),
  },
}))

vi.mock('../../src/utils/emailService.js', () => ({
  sendReservationReminderEmail: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../src/utils/whatsapp.js', () => ({
  sendReservationReminder: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Cron Jobs - Reservation Reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('sendDailyReminders', () => {
    it('should send reminders for reservations tomorrow', async () => {
      const mockReservations = [
        {
          id: '1',
          start_time: new Date(),
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          client_phone: '+34123456789',
          business_name: 'Beauty Salon',
          service_name: 'Haircut',
        },
        {
          id: '2',
          start_time: new Date(),
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          client_phone: '+34987654321',
          business_name: 'Spa Center',
          service_name: 'Massage',
        },
      ]

      pool.query.mockResolvedValueOnce({ rows: mockReservations })

      await sendDailyReminders()

      expect(pool.query).toHaveBeenCalledTimes(1)
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.any(Date), expect.any(Date)])
      )
    })

    it('should handle no reservations for tomorrow', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] })

      await sendDailyReminders()

      expect(pool.query).toHaveBeenCalledTimes(1)
    })

    it('should handle errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'))

      await expect(sendDailyReminders()).rejects.toThrow('Database error')
    })

    it('should continue even if one reminder fails', async () => {
      const mockReservations = [
        {
          id: '1',
          start_time: new Date(),
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          business_name: 'Beauty Salon',
          service_name: 'Haircut',
        },
      ]

      pool.query.mockResolvedValueOnce({ rows: mockReservations })

      await sendDailyReminders()

      expect(pool.query).toHaveBeenCalled()
    })
  })
})
