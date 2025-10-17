import pool from '../config/database.js'
import { sendNotification } from './notificationService.js'
import cron from 'node-cron'

/**
 * Programar recordatorio para una reserva
 */
export const scheduleReminder = async (reservation, hoursBeforeOptions) => {
  try {
    const salonSettings = await pool.query(
      `SELECT send_reminder_whatsapp, reminder_hours_before
       FROM salon_settings
       WHERE salon_profile_id = $1`,
      [reservation.salon_profile_id]
    )

    if (salonSettings.rows.length === 0 || !salonSettings.rows[0].send_reminder_whatsapp) {
      return { scheduled: false, reason: 'Reminders disabled for salon' }
    }

    const hoursBefore = hoursBeforeOptions || salonSettings.rows[0].reminder_hours_before || 24

    const reservationTime = new Date(reservation.start_time)
    const reminderTime = new Date(reservationTime.getTime() - (hoursBefore * 60 * 60 * 1000))

    if (reminderTime < new Date()) {
      return { scheduled: false, reason: 'Reminder time already passed' }
    }

    const serviceResult = await pool.query(
      `SELECT s.name as service_name, sp.business_name as salon_name
       FROM salon_services s
       JOIN salon_profiles sp ON s.salon_profile_id = sp.id
       WHERE s.id = $1`,
      [reservation.service_id]
    )

    const userResult = await pool.query(
      'SELECT name, phone FROM users WHERE id = $1',
      [reservation.user_id]
    )

    if (serviceResult.rows.length === 0 || userResult.rows.length === 0) {
      return { scheduled: false, reason: 'Service or user not found' }
    }

    const service = serviceResult.rows[0]
    const user = userResult.rows[0]

    const variables = {
      user_name: user.name,
      salon_name: service.salon_name,
      service_name: service.service_name,
      start_time: reservationTime.toLocaleString('es-ES')
    }

    await pool.query(
      `INSERT INTO scheduled_notifications (
        reservation_id, template_key, recipient_id, recipient_phone,
        template_variables, scheduled_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        reservation.id,
        'reservation_reminder',
        reservation.user_id,
        user.phone || reservation.client_phone,
        JSON.stringify(variables),
        reminderTime
      ]
    )

    return { scheduled: true, scheduledAt: reminderTime }

  } catch (error) {
    console.error('Error scheduling reminder:', error)
    throw error
  }
}

/**
 * Procesar notificaciones pendientes
 */
export const processScheduledNotifications = async () => {
  try {
    const pending = await pool.query(
      `SELECT * FROM scheduled_notifications
       WHERE status = 'pending'
         AND scheduled_at <= NOW()
       ORDER BY scheduled_at
       LIMIT 100`
    )

    const results = {
      sent: 0,
      failed: 0,
      total: pending.rows.length
    }

    for (const notification of pending.rows) {
      try {
        const template = await pool.query(
          'SELECT notification_type FROM notification_templates WHERE template_key = $1',
          [notification.template_key]
        )

        if (template.rows.length === 0) {
          await markNotificationFailed(notification.id, 'Template not found')
          results.failed++
          continue
        }

        const recipient = notification.recipient_phone || notification.recipient_email || notification.recipient_id

        await sendNotification(
          notification.template_key,
          recipient,
          notification.template_variables
        )

        await pool.query(
          `UPDATE scheduled_notifications
           SET status = 'sent', sent_at = NOW()
           WHERE id = $1`,
          [notification.id]
        )

        results.sent++

      } catch (error) {
        console.error(`Error sending notification ${notification.id}:`, error)

        if (notification.retry_count < notification.max_retries) {
          const nextRetry = new Date(Date.now() + (30 * 60 * 1000))
          await pool.query(
            `UPDATE scheduled_notifications
             SET status = 'failed',
                 failed_at = NOW(),
                 failure_reason = $1,
                 retry_count = retry_count + 1,
                 next_retry_at = $2
             WHERE id = $3`,
            [error.message, nextRetry, notification.id]
          )
        } else {
          await markNotificationFailed(notification.id, error.message)
        }

        results.failed++
      }
    }

    return results

  } catch (error) {
    console.error('Error processing scheduled notifications:', error)
    throw error
  }
}

/**
 * Procesar reintentos fallidos
 */
export const processFailedRetries = async () => {
  try {
    const retries = await pool.query(
      `SELECT * FROM scheduled_notifications
       WHERE status = 'failed'
         AND retry_count < max_retries
         AND next_retry_at <= NOW()
       LIMIT 50`
    )

    const results = {
      retried: 0,
      failed: 0,
      total: retries.rows.length
    }

    for (const notification of retries.rows) {
      try {
        const recipient = notification.recipient_phone || notification.recipient_email || notification.recipient_id

        await sendNotification(
          notification.template_key,
          recipient,
          notification.template_variables
        )

        await pool.query(
          `UPDATE scheduled_notifications
           SET status = 'sent', sent_at = NOW()
           WHERE id = $1`,
          [notification.id]
        )

        results.retried++

      } catch (error) {
        console.error(`Retry failed for notification ${notification.id}:`, error)

        if (notification.retry_count + 1 >= notification.max_retries) {
          await markNotificationFailed(notification.id, error.message)
        } else {
          const nextRetry = new Date(Date.now() + (60 * 60 * 1000))
          await pool.query(
            `UPDATE scheduled_notifications
             SET retry_count = retry_count + 1,
                 next_retry_at = $1,
                 failure_reason = $2
             WHERE id = $3`,
            [nextRetry, error.message, notification.id]
          )
        }

        results.failed++
      }
    }

    return results

  } catch (error) {
    console.error('Error processing failed retries:', error)
    throw error
  }
}

/**
 * Cancelar recordatorios de una reserva
 */
export const cancelReservationReminders = async (reservationId) => {
  await pool.query(
    `UPDATE scheduled_notifications
     SET status = 'cancelled', cancelled_at = NOW()
     WHERE reservation_id = $1 AND status = 'pending'`,
    [reservationId]
  )
}

/**
 * Marcar notificación como fallida permanentemente
 */
const markNotificationFailed = async (notificationId, reason) => {
  await pool.query(
    `UPDATE scheduled_notifications
     SET status = 'failed',
         failed_at = NOW(),
         failure_reason = $1
     WHERE id = $2`,
    [reason, notificationId]
  )
}

/**
 * Iniciar cron job para procesar notificaciones
 */
export const startReminderCron = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('Processing scheduled notifications...')
    try {
      const results = await processScheduledNotifications()
      console.log(`Processed ${results.total} notifications: ${results.sent} sent, ${results.failed} failed`)

      const retryResults = await processFailedRetries()
      console.log(`Processed ${retryResults.total} retries: ${retryResults.retried} succeeded, ${retryResults.failed} failed`)
    } catch (error) {
      console.error('Cron job error:', error)
    }
  })

  console.log('Reminder cron job started (runs every 5 minutes)')
}

/**
 * Obtener estadísticas de recordatorios
 */
export const getReminderStats = async (salonId, startDate, endDate) => {
  const result = await pool.query(
    `SELECT 
       COUNT(*) FILTER (WHERE sn.status = 'sent') as sent,
       COUNT(*) FILTER (WHERE sn.status = 'pending') as pending,
       COUNT(*) FILTER (WHERE sn.status = 'failed') as failed,
       COUNT(*) FILTER (WHERE sn.status = 'cancelled') as cancelled,
       COUNT(*) as total
     FROM scheduled_notifications sn
     JOIN reservations r ON sn.reservation_id = r.id
     WHERE r.salon_profile_id = $1
       AND r.start_time BETWEEN $2 AND $3`,
    [salonId, startDate, endDate]
  )

  return result.rows[0]
}
