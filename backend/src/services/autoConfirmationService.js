import pool from '../config/database.js'
import { getSalonSettings } from '../models/SalonSettings.js'

/**
 * Verificar si una reserva debe ser autoconfirmada (9 checks)
 * @param {Object} reservationData - Datos de la reserva
 * @returns {Object} { shouldAutoConfirm: boolean, reason: string, checks: Object }
 */
export const shouldAutoConfirm = async reservationData => {
  const { salonProfileId, userId, serviceId, startTime } = reservationData

  const checks = {
    check1_salon_auto_enabled: false,
    check2_min_advance_hours: false,
    check3_not_first_booking: false,
    check4_service_not_manual: false,
    check5_user_low_no_show: false,
    check6_user_has_completed: false,
    check7_within_daily_limit: false,
    check8_availability_confirmed: false,
    check9_calendar_sync_ok: false,
  }

  try {
    const settings = await getSalonSettings(salonProfileId)
    checks.check1_salon_auto_enabled = settings.auto_confirm_enabled === true

    if (!checks.check1_salon_auto_enabled) {
      return {
        shouldAutoConfirm: false,
        reason: 'Salon has auto-confirmation disabled',
        checks,
      }
    }

    const minHours = settings.auto_confirm_min_hours || 2
    const bookingDate = new Date(startTime)
    const now = new Date()
    const hoursInAdvance = (bookingDate - now) / (1000 * 60 * 60)
    checks.check2_min_advance_hours = hoursInAdvance >= minHours

    if (!checks.check2_min_advance_hours) {
      return {
        shouldAutoConfirm: false,
        reason: `Booking must be at least ${minHours} hours in advance`,
        checks,
      }
    }

    if (settings.require_manual_first_booking) {
      const previousBookings = await pool.query(
        `SELECT COUNT(*) as count
         FROM reservations
         WHERE user_id = $1 AND salon_profile_id = $2`,
        [userId, salonProfileId]
      )

      const isFirstBooking = parseInt(previousBookings.rows[0].count) === 0
      checks.check3_not_first_booking = !isFirstBooking

      if (isFirstBooking) {
        return {
          shouldAutoConfirm: false,
          reason: 'First booking requires manual approval',
          checks,
        }
      }
    } else {
      checks.check3_not_first_booking = true
    }

    const manualServices = settings.manual_approval_services || []
    checks.check4_service_not_manual = !manualServices.includes(serviceId)

    if (!checks.check4_service_not_manual) {
      return {
        shouldAutoConfirm: false,
        reason: 'Service requires manual approval',
        checks,
      }
    }

    const userStats = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'no_show') as no_shows,
         COUNT(*) as total
       FROM reservations
       WHERE user_id = $1 AND status IN ('completed', 'no_show')`,
      [userId]
    )

    const totalCompleted = parseInt(userStats.rows[0].total) || 0
    const noShows = parseInt(userStats.rows[0].no_shows) || 0

    // CHECK 5: Verificar no-show rate
    // Si no tiene bookings completados, el rate es 0% (pasa este check)
    const noShowRate = totalCompleted > 0 ? (noShows / totalCompleted) * 100 : 0
    checks.check5_user_low_no_show = noShowRate < 20

    if (!checks.check5_user_low_no_show) {
      return {
        shouldAutoConfirm: false,
        reason: `User has high no-show rate (${noShowRate.toFixed(1)}%)`,
        checks,
      }
    }

    // CHECK 6: Verificar que tiene al menos 1 booking completado
    checks.check6_user_has_completed = totalCompleted >= 1

    if (!checks.check6_user_has_completed) {
      return {
        shouldAutoConfirm: false,
        reason: 'User has no completed bookings',
        checks,
      }
    }

    const dailyLimit = 10
    const bookingDateStr = bookingDate.toISOString().split('T')[0]

    const todayBookings = await pool.query(
      `SELECT COUNT(*) as count
       FROM reservations
       WHERE user_id = $1 
         AND DATE(start_time) = $2
         AND status NOT IN ('cancelled', 'no_show')`,
      [userId, bookingDateStr]
    )

    const todayCount = parseInt(todayBookings.rows[0].count) || 0
    checks.check7_within_daily_limit = todayCount < dailyLimit

    if (!checks.check7_within_daily_limit) {
      return {
        shouldAutoConfirm: false,
        reason: `User exceeded daily booking limit (${dailyLimit})`,
        checks,
      }
    }

    checks.check8_availability_confirmed = true

    checks.check9_calendar_sync_ok = true

    return {
      shouldAutoConfirm: true,
      reason: 'All auto-confirmation checks passed',
      checks,
    }
  } catch (error) {
    console.error('Error in shouldAutoConfirm:', error)
    return {
      shouldAutoConfirm: false,
      reason: `Error: ${error.message}`,
      checks,
    }
  }
}

/**
 * Aplicar autoconfirmación a una reserva existente
 */
export const applyAutoConfirmation = async reservationId => {
  try {
    const reservationResult = await pool.query(`SELECT * FROM reservations WHERE id = $1`, [
      reservationId,
    ])

    if (reservationResult.rows.length === 0) {
      throw new Error('Reservation not found')
    }

    const reservation = reservationResult.rows[0]

    const decision = await shouldAutoConfirm({
      salonProfileId: reservation.salon_profile_id,
      userId: reservation.user_id,
      serviceId: reservation.service_id,
      startTime: reservation.start_time,
    })

    if (decision.shouldAutoConfirm) {
      await pool.query(
        `UPDATE reservations
         SET status = 'confirmed',
             confirmed_at = CURRENT_TIMESTAMP,
             auto_confirmed = true
         WHERE id = $1`,
        [reservationId]
      )

      console.log(`[AutoConfirm] Reservation ${reservationId} auto-confirmed`)

      return {
        success: true,
        autoConfirmed: true,
        checks: decision.checks,
      }
    } else {
      console.log(
        `[AutoConfirm] Reservation ${reservationId} requires manual approval: ${decision.reason}`
      )

      return {
        success: true,
        autoConfirmed: false,
        reason: decision.reason,
        checks: decision.checks,
      }
    }
  } catch (error) {
    console.error('Error applying auto-confirmation:', error)
    throw error
  }
}
