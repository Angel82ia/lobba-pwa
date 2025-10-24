/**
 * Appointment Reminder Cron Job - FASE 2
 * 
 * Envía recordatorios automáticos 24h antes de las citas
 * - WhatsApp ONE-WAY (número LOBBA +34614392922)
 * - Email
 * 
 * Corre cada hora para detectar citas que necesitan recordatorio
 */

import cron from 'node-cron'
import pool from '../config/database.js'
import logger from '../utils/logger.js'

let notificationOrchestrator = null

/**
 * Inicializar el cron job
 * @param {NotificationOrchestrator} orchestrator - Instancia del orquestador
 */
export function startAppointmentReminderCron(orchestrator) {
  notificationOrchestrator = orchestrator

  cron.schedule('0 * * * *', async () => {
    logger.info('🕐 Ejecutando cron job de recordatorios de citas...')
    await sendAppointmentReminders()
  })

  logger.info('✅ Cron job de recordatorios inicializado (cada hora)')
}

/**
 * Buscar y enviar recordatorios para citas que son en ~24h
 */
async function sendAppointmentReminders() {
  try {
    if (!notificationOrchestrator) {
      logger.warn('⚠️  Orchestrator no disponible, saltando recordatorios')
      return
    }

    const query = `
      SELECT 
        a.id,
        a.user_id,
        a.salon_profile_id,
        a.start_time,
        a.end_time,
        a.client_phone,
        a.client_email,
        a.reminder_sent,
        u.name as client_name,
        ss.name as service_name,
        sp.business_name as salon_name,
        su.email as salon_owner_email
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN salon_services ss ON a.service_id = ss.id
      JOIN salon_profiles sp ON a.salon_profile_id = sp.id
      JOIN users su ON sp.user_id = su.id
      WHERE a.status = 'confirmed'
        AND a.reminder_sent = FALSE
        AND a.start_time BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
      ORDER BY a.start_time ASC
    `

    const result = await pool.query(query)

    if (result.rows.length === 0) {
      logger.info('ℹ️  No hay citas que requieran recordatorio en este momento')
      return
    }

    logger.info(`📧 Enviando ${result.rows.length} recordatorios...`)

    let successCount = 0
    let errorCount = 0

    for (const appointment of result.rows) {
      try {
        const appointmentData = {
          id: appointment.id,
          client_name: appointment.client_name,
          client_phone: appointment.client_phone,
          client_email: appointment.client_email,
          appointment_date: new Date(appointment.start_time).toLocaleDateString('es-ES'),
          appointment_time: new Date(appointment.start_time).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          service_type: appointment.service_name || 'Servicio',
        }

        const salonData = {
          name: appointment.salon_name,
          business_name: appointment.salon_name,
          owner_email: appointment.salon_owner_email,
        }

        await notificationOrchestrator.sendAppointmentReminder(appointmentData, salonData)

        successCount++

        logger.info(
          `✅ Recordatorio enviado: ${appointment.client_name} - ${appointmentData.appointment_date} ${appointmentData.appointment_time}`
        )
      } catch (error) {
        errorCount++
        logger.error(`❌ Error enviando recordatorio para cita ${appointment.id}:`, error)
      }
    }

    logger.info(`📊 Recordatorios completados: ${successCount} exitosos, ${errorCount} errores`)
  } catch (error) {
    logger.error('❌ Error en cron job de recordatorios:', error)
  }
}

/**
 * Función manual para enviar recordatorios (testing/admin)
 */
export async function sendRemindersNow(orchestrator) {
  notificationOrchestrator = orchestrator
  await sendAppointmentReminders()
}

export default {
  startAppointmentReminderCron,
  sendRemindersNow,
}
