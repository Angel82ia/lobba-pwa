import { describe, it, expect, beforeEach, vi } from 'vitest'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js', () => ({
  default: {
    query: vi.fn(),
    connect: vi.fn()
  }
}))

vi.mock('../../src/models/SalonSettings.js', () => ({
  getSalonSettings: vi.fn()
}))

const { shouldAutoConfirm, applyAutoConfirmation } = await import('../../src/services/autoConfirmationService.js')
const { getSalonSettings } = await import('../../src/models/SalonSettings.js')

describe('AutoConfirmationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('shouldAutoConfirm - 9 checks', () => {
    const mockReservationData = {
      salonProfileId: 'salon-1',
      userId: 'user-1',
      serviceId: 'service-1',
      startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
    }

    it('CHECK 1: should fail if salon auto_confirm disabled', async () => {
      getSalonSettings.mockResolvedValue({
        auto_confirm_enabled: false
      })

      const result = await shouldAutoConfirm(mockReservationData)

      expect(result.shouldAutoConfirm).toBe(false)
      expect(result.reason).toContain('auto-confirmation disabled')
      expect(result.checks.check1_salon_auto_enabled).toBe(false)
    })

    it('CHECK 2: should fail if booking less than min hours advance', async () => {
      getSalonSettings.mockResolvedValue({
        auto_confirm_enabled: true,
        auto_confirm_min_hours: 24
      })

      const shortNotice = {
        ...mockReservationData,
        startTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString()
      }

      const result = await shouldAutoConfirm(shortNotice)

      expect(result.shouldAutoConfirm).toBe(false)
      expect(result.reason).toContain('at least 24 hours')
      expect(result.checks.check2_min_advance_hours).toBe(false)
    })

    it('CHECK 3: should fail if first booking and require_manual_first_booking=true', async () => {
      getSalonSettings.mockResolvedValue({
        auto_confirm_enabled: true,
        auto_confirm_min_hours: 2,
        require_manual_first_booking: true
      })

      pool.query.mockResolvedValue({
        rows: [{ count: '0' }]
      })

      const result = await shouldAutoConfirm(mockReservationData)

      expect(result.shouldAutoConfirm).toBe(false)
      expect(result.reason).toContain('First booking')
      expect(result.checks.check3_not_first_booking).toBe(false)
    })

    it('CHECK 4: should fail if service requires manual approval', async () => {
      getSalonSettings.mockResolvedValue({
        auto_confirm_enabled: true,
        auto_confirm_min_hours: 2,
        require_manual_first_booking: false,
        manual_approval_services: ['service-1', 'service-2']
      })

      pool.query.mockResolvedValue({
        rows: [{ count: '1' }]
      })

      const result = await shouldAutoConfirm(mockReservationData)

      expect(result.shouldAutoConfirm).toBe(false)
      expect(result.reason).toContain('Service requires manual')
      expect(result.checks.check4_service_not_manual).toBe(false)
    })

    it('CHECK 5: should fail if user has high no-show rate (>=20%)', async () => {
      getSalonSettings.mockResolvedValue({
        auto_confirm_enabled: true,
        auto_confirm_min_hours: 2,
        require_manual_first_booking: false,
        manual_approval_services: []
      })

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [{ total: '10', no_shows: '3' }]
        })

      const result = await shouldAutoConfirm(mockReservationData)

      expect(result.shouldAutoConfirm).toBe(false)
      expect(result.reason).toContain('high no-show rate')
      expect(result.checks.check5_user_low_no_show).toBe(false)
    })

    it('CHECK 6: should fail if user has no completed bookings', async () => {
      getSalonSettings.mockResolvedValue({
        auto_confirm_enabled: true,
        auto_confirm_min_hours: 2,
        require_manual_first_booking: false,
        manual_approval_services: []
      })

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [{ total: '0', no_shows: '0' }]
        })

      const result = await shouldAutoConfirm(mockReservationData)

      expect(result.shouldAutoConfirm).toBe(false)
      expect(result.reason).toContain('no completed bookings')
      expect(result.checks.check6_user_has_completed).toBe(false)
    })

    it('CHECK 7: should fail if user exceeded daily limit', async () => {
      getSalonSettings.mockResolvedValue({
        auto_confirm_enabled: true,
        auto_confirm_min_hours: 2,
        require_manual_first_booking: false,
        manual_approval_services: []
      })

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [{ total: '5', no_shows: '0' }]
        })
        .mockResolvedValueOnce({
          rows: [{ count: '10' }]
        })

      const result = await shouldAutoConfirm(mockReservationData)

      expect(result.shouldAutoConfirm).toBe(false)
      expect(result.reason).toContain('daily booking limit')
      expect(result.checks.check7_within_daily_limit).toBe(false)
    })

    it('should PASS all checks and auto-confirm', async () => {
      getSalonSettings.mockResolvedValue({
        auto_confirm_enabled: true,
        auto_confirm_min_hours: 2,
        require_manual_first_booking: false,
        manual_approval_services: []
      })

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({
          rows: [{ total: '10', no_shows: '1' }]
        })
        .mockResolvedValueOnce({
          rows: [{ count: '2' }]
        })

      const result = await shouldAutoConfirm(mockReservationData)

      expect(result.shouldAutoConfirm).toBe(true)
      expect(result.reason).toContain('All auto-confirmation checks passed')
      expect(result.checks.check1_salon_auto_enabled).toBe(true)
      expect(result.checks.check2_min_advance_hours).toBe(true)
      expect(result.checks.check3_not_first_booking).toBe(true)
      expect(result.checks.check4_service_not_manual).toBe(true)
      expect(result.checks.check5_user_low_no_show).toBe(true)
      expect(result.checks.check6_user_has_completed).toBe(true)
      expect(result.checks.check7_within_daily_limit).toBe(true)
      expect(result.checks.check8_availability_confirmed).toBe(true)
      expect(result.checks.check9_calendar_sync_ok).toBe(true)
    })
  })

  describe('applyAutoConfirmation', () => {
    it('should update reservation to confirmed if passes checks', async () => {
      getSalonSettings.mockResolvedValue({
        auto_confirm_enabled: true,
        auto_confirm_min_hours: 2,
        require_manual_first_booking: false,
        manual_approval_services: []
      })

      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'res-1',
            salon_profile_id: 'salon-1',
            user_id: 'user-1',
            service_id: 'service-1',
            start_time: new Date(Date.now() + 3 * 60 * 60 * 1000)
          }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({
          rows: [{ total: '10', no_shows: '1' }]
        })
        .mockResolvedValueOnce({
          rows: [{ count: '2' }]
        })
        .mockResolvedValueOnce({ rows: [] })

      const result = await applyAutoConfirmation('res-1')

      expect(result.success).toBe(true)
      expect(result.autoConfirmed).toBe(true)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE reservations'),
        ['res-1']
      )
    })

    it('should keep reservation pending if fails checks', async () => {
      getSalonSettings.mockResolvedValue({
        auto_confirm_enabled: false
      })

      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'res-1',
          salon_profile_id: 'salon-1',
          user_id: 'user-1',
          service_id: 'service-1',
          start_time: new Date(Date.now() + 3 * 60 * 60 * 1000)
        }]
      })

      const result = await applyAutoConfirmation('res-1')

      expect(result.success).toBe(true)
      expect(result.autoConfirmed).toBe(false)
      expect(result.reason).toContain('auto-confirmation disabled')
    })
  })
})
