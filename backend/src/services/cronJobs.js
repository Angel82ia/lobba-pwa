import cron from 'node-cron'
import pool from '../config/database.js'
import { sendReservationReminderEmail } from '../utils/emailService.js'
import { sendReservationReminder } from '../utils/whatsapp.js'
import logger from '../utils/logger.js'

export const startCronJobs = () => {
  cron.schedule('0 10 * * *', async () => {
    logger.info('Running daily reminder cron job...')
    await sendDailyReminders()
  })

  logger.info('Cron jobs initialized')
}

export const sendDailyReminders = async () => {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    const result = await pool.query(
      `SELECT r.*, 
              u.first_name, u.last_name, u.email,
              sp.business_name, sp.email as salon_email,
              ss.name as service_name
       FROM reservations r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN salon_profiles sp ON r.salon_profile_id = sp.id
       LEFT JOIN salon_services ss ON r.service_id = ss.id
       WHERE r.status IN ('pending', 'confirmed')
         AND r.start_time >= $1
         AND r.start_time < $2`,
      [tomorrow, dayAfterTomorrow]
    )

    logger.info(`Found ${result.rows.length} reservations for tomorrow`)

    for (const reservation of result.rows) {
      try {
        await sendReservationReminder({
          ...reservation,
          salon_profile: { business_name: reservation.business_name },
        })
      } catch (error) {
        logger.error(`Error sending WhatsApp reminder for reservation ${reservation.id}:`, error)
      }

      try {
        await sendReservationReminderEmail({
          ...reservation,
          client_email: reservation.email,
          salon_profile: { business_name: reservation.business_name },
          service: { name: reservation.service_name },
        })
      } catch (error) {
        logger.error(`Error sending email reminder for reservation ${reservation.id}:`, error)
      }
    }

    logger.info('Daily reminders sent successfully')
  } catch (error) {
    logger.error('Error in sendDailyReminders:', error)
    throw error
  }
}
