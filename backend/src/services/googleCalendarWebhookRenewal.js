import cron from 'node-cron'
import pool from '../config/database.js'
import { setupWebhook } from './googleCalendarService.js'
import logger from '../utils/logger.js'

/**
 * Renovar webhooks de Google Calendar que están próximos a expirar
 * Se ejecuta diariamente y renueva webhooks con menos de 2 días de vida
 */
export const renewExpiringWebhooks = async () => {
  try {
    logger.info('🔄 [Webhook Renewal] Starting webhook renewal check')

    // Buscar salones con webhooks que expiran en menos de 2 días
    const expiringWebhooks = await pool.query(
      `SELECT 
        id,
        business_name,
        google_webhook_channel_id,
        google_webhook_expiration
       FROM salon_profiles
       WHERE google_webhook_channel_id IS NOT NULL
         AND google_webhook_expiration IS NOT NULL
         AND google_webhook_expiration < NOW() + INTERVAL '2 days'
         AND google_sync_enabled = true
         AND google_calendar_enabled = true`
    )

    if (expiringWebhooks.rows.length === 0) {
      logger.info('✅ [Webhook Renewal] No webhooks need renewal')
      return { renewed: 0, failed: 0 }
    }

    logger.info(`🔔 [Webhook Renewal] Found ${expiringWebhooks.rows.length} webhooks to renew`)

    const results = {
      renewed: 0,
      failed: 0,
      errors: [],
    }

    for (const salon of expiringWebhooks.rows) {
      try {
        const expirationDate = new Date(salon.google_webhook_expiration)
        const hoursUntilExpiry = (expirationDate - new Date()) / (1000 * 60 * 60)

        logger.info(`🔄 [Webhook Renewal] Renewing webhook for salon:`, {
          salonId: salon.id,
          salonName: salon.business_name,
          currentExpiration: expirationDate.toISOString(),
          hoursUntilExpiry: Math.round(hoursUntilExpiry),
        })

        // Crear nuevo webhook (Google automáticamente invalida el anterior)
        const webhookUrl = `${process.env.BACKEND_URL}/api/google-calendar/webhook`
        await setupWebhook(salon.id, webhookUrl)

        results.renewed++

        logger.info(`✅ [Webhook Renewal] Successfully renewed webhook for salon:`, {
          salonId: salon.id,
          salonName: salon.business_name,
        })
      } catch (error) {
        results.failed++
        results.errors.push({
          salonId: salon.id,
          salonName: salon.business_name,
          error: error.message,
        })

        logger.error(`❌ [Webhook Renewal] Failed to renew webhook for salon:`, {
          salonId: salon.id,
          salonName: salon.business_name,
          error: error.message,
          stack: error.stack,
        })

        // Notificar al salón (opcional - podrías enviar email/notificación)
        try {
          await pool.query(
            `INSERT INTO notifications (
              user_id, 
              notification_type, 
              title, 
              message, 
              status
            )
            SELECT 
              user_id,
              'system',
              'Google Calendar: Webhook Renewal Failed',
              $1,
              'unread'
            FROM salon_profiles
            WHERE id = $2`,
            [
              `No pudimos renovar la conexión automática con Google Calendar. Por favor, reactiva la sincronización desde tu panel de configuración.`,
              salon.id,
            ]
          )
        } catch (notifError) {
          logger.error('Failed to create notification:', notifError)
        }
      }
    }

    logger.info(`🏁 [Webhook Renewal] Renewal process completed:`, {
      total: expiringWebhooks.rows.length,
      renewed: results.renewed,
      failed: results.failed,
    })

    return results
  } catch (error) {
    logger.error('❌ [Webhook Renewal] Error in renewal process:', {
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}

/**
 * Limpiar webhooks expirados (más de 7 días sin renovar)
 * Estos ya no funcionan, así que los marcamos como inactivos
 */
export const cleanupExpiredWebhooks = async () => {
  try {
    logger.info('🧹 [Webhook Cleanup] Starting cleanup of expired webhooks')

    const result = await pool.query(
      `UPDATE salon_profiles
       SET google_webhook_channel_id = NULL,
           google_webhook_resource_id = NULL,
           google_webhook_expiration = NULL,
           google_sync_enabled = false
       WHERE google_webhook_expiration < NOW() - INTERVAL '1 day'
         AND google_webhook_channel_id IS NOT NULL
       RETURNING id, business_name`
    )

    if (result.rows.length > 0) {
      logger.warn(`⚠️  [Webhook Cleanup] Cleaned up ${result.rows.length} expired webhooks:`, {
        salons: result.rows.map(s => ({ id: s.id, name: s.business_name })),
      })

      // Notificar a los salones afectados
      for (const salon of result.rows) {
        try {
          await pool.query(
            `INSERT INTO notifications (
              user_id, 
              notification_type, 
              title, 
              message, 
              status
            )
            SELECT 
              user_id,
              'warning',
              'Google Calendar: Sincronización Desactivada',
              $1,
              'unread'
            FROM salon_profiles
            WHERE id = $2`,
            [
              `La sincronización automática con Google Calendar se desactivó por inactividad. Reactívala desde tu panel de configuración para seguir sincronizando tus eventos.`,
              salon.id,
            ]
          )
        } catch (notifError) {
          logger.error('Failed to create cleanup notification:', notifError)
        }
      }
    } else {
      logger.info('✅ [Webhook Cleanup] No expired webhooks to clean')
    }

    return { cleaned: result.rows.length }
  } catch (error) {
    logger.error('❌ [Webhook Cleanup] Error in cleanup process:', {
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}

/**
 * Iniciar cron job de renovación automática
 * Se ejecuta todos los días a las 3 AM
 */
export const startWebhookRenewalCron = () => {
  // Ejecutar todos los días a las 3 AM
  cron.schedule('0 3 * * *', async () => {
    logger.info('⏰ [Cron] Starting scheduled webhook renewal')
    try {
      await renewExpiringWebhooks()
      await cleanupExpiredWebhooks()
    } catch (error) {
      logger.error('❌ [Cron] Webhook renewal cron job failed:', {
        error: error.message,
        stack: error.stack,
      })
    }
  })

  logger.info('✅ [Cron] Webhook renewal cron job started (runs daily at 3 AM)')
}

/**
 * Ejecutar renovación manual (para testing o forzar)
 */
export const forceWebhookRenewal = async salonId => {
  logger.info(`🔧 [Manual Renewal] Forcing webhook renewal for salon:`, salonId)

  try {
    const webhookUrl = `${process.env.BACKEND_URL}/api/google-calendar/webhook`
    await setupWebhook(salonId, webhookUrl)

    logger.info(`✅ [Manual Renewal] Webhook renewed successfully for salon:`, salonId)
    return { success: true, salonId }
  } catch (error) {
    logger.error(`❌ [Manual Renewal] Failed to renew webhook:`, {
      salonId,
      error: error.message,
    })
    throw error
  }
}
