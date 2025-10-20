import { describe, it, expect, beforeEach, vi } from 'vitest'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js', () => ({
  default: {
    query: vi.fn(),
    connect: vi.fn(() => ({
      query: vi.fn(),
      release: vi.fn()
    }))
  }
}))

vi.mock('../../src/services/stripeConnectService.js', () => ({
  refundReservationPayment: vi.fn()
}))

const { checkReservationTimeout, setConfirmationDeadline } = await import('../../src/services/reservationTimeoutService.js')

describe('Reservation Timeout Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkReservationTimeout', () => {
    it('should return timeout status for active reservation', async () => {
      pool.query.mockResolvedValue({
        rows: [{
          confirmation_deadline: '2025-10-20T14:00:00Z',
          minutes_remaining: 45,
          expired: false
        }]
      })

      const result = await checkReservationTimeout(1)

      expect(result).toEqual({
        expired: false,
        minutesRemaining: 45,
        deadline: '2025-10-20T14:00:00Z'
      })
    })

    it('should return expired=true when deadline passed', async () => {
      pool.query.mockResolvedValue({
        rows: [{
          confirmation_deadline: '2025-10-20T10:00:00Z',
          minutes_remaining: -15,
          expired: true
        }]
      })

      const result = await checkReservationTimeout(1)

      expect(result).toEqual({
        expired: true,
        minutesRemaining: 0,
        deadline: '2025-10-20T10:00:00Z'
      })
    })

    it('should throw error if reservation not found', async () => {
      pool.query.mockResolvedValue({
        rows: []
      })

      await expect(checkReservationTimeout(999)).rejects.toThrow('Reservation not found')
    })
  })

  describe('setConfirmationDeadline', () => {
    it('should set 2h deadline by default', async () => {
      pool.query.mockResolvedValue({ rows: [] })

      await setConfirmationDeadline(1)

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INTERVAL '2 hours'"),
        [1]
      )
    })

    it('should set custom deadline hours', async () => {
      pool.query.mockResolvedValue({ rows: [] })

      await setConfirmationDeadline(1, 4)

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INTERVAL '4 hours'"),
        [1]
      )
    })
  })
})
