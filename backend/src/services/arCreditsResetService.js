import pool from '../config/database.js'
import logger from '../utils/logger.js'

/**
 * Servicio para reset mensual automático de créditos AR
 * Ejecutar el día 1 de cada mes a las 00:00
 * 
 * Sistema unificado: 50 créditos AR/mes para uñas, peinados y maquillaje
 */

/**
 * Reset mensual de créditos AR para todos los usuarios
 * Utiliza la función SQL reset_monthly_ar_credits() definida en la migración
 */
export async function resetMonthlyARCredits() {
  try {
    logger.info('🔄 Iniciando reset mensual de créditos AR...')

    const startTime = Date.now()

    const result = await pool.query('SELECT reset_monthly_ar_credits() as affected_rows')
    
    const affectedRows = result.rows[0]?.affected_rows || 0
    const duration = Date.now() - startTime

    logger.info(`✅ Reset mensual completado: ${affectedRows} usuarios actualizados en ${duration}ms`)

    return {
      success: true,
      affected_users: affectedRows,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    logger.error('❌ Error en reset mensual de créditos AR:', error)
    
    await pool.query(
      `INSERT INTO audit_logs (event, description, metadata, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [
        'AR_CREDITS_RESET_ERROR',
        'Error al ejecutar reset mensual de créditos AR',
        JSON.stringify({
          error: error.message,
          stack: error.stack
        })
      ]
    )

    throw error
  }
}

/**
 * Verificar usuarios que necesitan reset (para debugging)
 */
export async function getUsersNeedingReset() {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        ar_credits,
        ar_credits_used,
        ar_credits_reset_date,
        DATE_TRUNC('month', ar_credits_reset_date) as reset_month,
        DATE_TRUNC('month', NOW()) as current_month
      FROM users
      WHERE DATE_TRUNC('month', ar_credits_reset_date) < DATE_TRUNC('month', NOW())
        AND ar_credits_used > 0
      ORDER BY ar_credits_reset_date ASC
      LIMIT 100
    `)

    return result.rows
  } catch (error) {
    logger.error('Error obteniendo usuarios que necesitan reset:', error)
    return []
  }
}

/**
 * Obtener estadísticas de uso de créditos AR del mes actual
 */
export async function getMonthlyARStats() {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT user_id) as active_users,
        SUM(credits_consumed) as total_credits_consumed,
        AVG(credits_consumed) as avg_credits_per_use,
        COUNT(*) as total_generations,
        SUM(CASE WHEN feature_type = 'nails' THEN credits_consumed ELSE 0 END) as nails_credits,
        SUM(CASE WHEN feature_type = 'hairstyle' THEN credits_consumed ELSE 0 END) as hairstyle_credits,
        SUM(CASE WHEN feature_type = 'makeup' THEN credits_consumed ELSE 0 END) as makeup_credits,
        COUNT(CASE WHEN feature_type = 'nails' THEN 1 END) as nails_generations,
        COUNT(CASE WHEN feature_type = 'hairstyle' THEN 1 END) as hairstyle_generations,
        COUNT(CASE WHEN feature_type = 'makeup' THEN 1 END) as makeup_generations
      FROM ar_credits_usage_log
      WHERE created_at >= DATE_TRUNC('month', NOW())
    `)

    return result.rows[0] || {
      active_users: 0,
      total_credits_consumed: 0,
      avg_credits_per_use: 0,
      total_generations: 0,
      nails_credits: 0,
      hairstyle_credits: 0,
      makeup_credits: 0,
      nails_generations: 0,
      hairstyle_generations: 0,
      makeup_generations: 0
    }
  } catch (error) {
    logger.error('Error obteniendo estadísticas mensuales AR:', error)
    return null
  }
}

/**
 * Obtener top usuarios por consumo de créditos AR
 */
export async function getTopARUsers(limit = 10) {
  try {
    const result = await pool.query(
      `SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.ar_credits_used,
        u.ar_credits,
        (u.ar_credits - u.ar_credits_used) as remaining,
        COUNT(acl.id) as total_generations,
        SUM(CASE WHEN acl.feature_type = 'nails' THEN 1 ELSE 0 END) as nails_count,
        SUM(CASE WHEN acl.feature_type = 'hairstyle' THEN 1 ELSE 0 END) as hairstyle_count,
        SUM(CASE WHEN acl.feature_type = 'makeup' THEN 1 ELSE 0 END) as makeup_count
      FROM users u
      LEFT JOIN ar_credits_usage_log acl ON u.id = acl.user_id 
        AND acl.created_at >= DATE_TRUNC('month', NOW())
      WHERE u.ar_credits_used > 0
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.ar_credits_used, u.ar_credits
      ORDER BY u.ar_credits_used DESC
      LIMIT $1`,
      [limit]
    )

    return result.rows
  } catch (error) {
    logger.error('Error obteniendo top usuarios AR:', error)
    return []
  }
}

/**
 * Configurar cron job para reset mensual
 * Ejecutar el día 1 de cada mes a las 00:00
 */
export function setupARCreditsCronJob() {
  const cron = require('node-cron')

  cron.schedule('0 0 1 * *', async () => {
    logger.info('⏰ Ejecutando cron job: Reset mensual de créditos AR')
    
    try {
      const result = await resetMonthlyARCredits()
      logger.info('✅ Cron job completado exitosamente:', result)
    } catch (error) {
      logger.error('❌ Error en cron job de reset AR:', error)
    }
  }, {
    timezone: 'Europe/Madrid'
  })

  logger.info('✅ Cron job de reset AR configurado: día 1 de cada mes a las 00:00 (Europe/Madrid)')
}

export default {
  resetMonthlyARCredits,
  getUsersNeedingReset,
  getMonthlyARStats,
  getTopARUsers,
  setupARCreditsCronJob
}
