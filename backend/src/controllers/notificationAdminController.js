/**
 * Notification Admin Controller - FASE 2
 * 
 * Endpoints para administrar notificaciones:
 * - Ver historial de notificaciones de una cita
 * - Reenviar notificación fallida
 * - Ver estadísticas de notificaciones
 */

import pool from '../config/database.js'
import logger from '../utils/logger.js'

/**
 * GET /api/notifications/appointment/:appointmentId
 * Obtener todas las notificaciones de una cita
 */
export const getAppointmentNotifications = async (req, res) => {
  try {
    const { appointmentId } = req.params

    const result = await pool.query(
      `SELECT 
        n.*,
        a.start_time as appointment_date
       FROM notifications n
       LEFT JOIN appointments a ON n.appointment_id = a.id
       WHERE n.appointment_id = $1
       ORDER BY n.created_at DESC`,
      [appointmentId]
    )

    res.json({
      success: true,
      count: result.rows.length,
      notifications: result.rows,
    })
  } catch (error) {
    logger.error('Error fetching appointment notifications:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    })
  }
}

/**
 * POST /api/notifications/:notificationId/resend
 * Reenviar una notificación fallida
 */
export const resendNotification = async (req, res) => {
  try {
    const { notificationId } = req.params
    const orchestrator = req.app.get('notificationOrchestrator')

    if (!orchestrator) {
      return res.status(503).json({
        success: false,
        error: 'Notification orchestrator not available',
      })
    }

    const result = await orchestrator.resendNotification(notificationId)

    res.json({
      success: true,
      message: 'Notification resent successfully',
      result,
    })
  } catch (error) {
    logger.error('Error resending notification:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resend notification',
    })
  }
}

/**
 * GET /api/notifications/stats
 * Obtener estadísticas de notificaciones
 */
export const getNotificationStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const dateFilter = startDate && endDate 
      ? `AND created_at BETWEEN $1 AND $2`
      : ''
    
    const params = startDate && endDate ? [startDate, endDate] : []

    const statsQuery = `
      SELECT 
        type,
        status,
        COUNT(*) as count
      FROM notifications
      WHERE 1=1 ${dateFilter}
      GROUP BY type, status
      ORDER BY type, status
    `

    const totalQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'sent' OR status = 'delivered' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM notifications
      WHERE 1=1 ${dateFilter}
    `

    const [statsResult, totalResult] = await Promise.all([
      pool.query(statsQuery, params),
      pool.query(totalQuery, params),
    ])

    res.json({
      success: true,
      summary: totalResult.rows[0],
      breakdown: statsResult.rows,
    })
  } catch (error) {
    logger.error('Error fetching notification stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification stats',
    })
  }
}

/**
 * GET /api/notifications/recent
 * Obtener notificaciones recientes
 */
export const getRecentNotifications = async (req, res) => {
  try {
    const { limit = 50, status, type } = req.query

    let whereConditions = []
    let params = []
    let paramIndex = 1

    if (status) {
      whereConditions.push(`n.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (type) {
      whereConditions.push(`n.type = $${paramIndex}`)
      params.push(type)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    params.push(limit)

    const query = `
      SELECT 
        n.*,
        a.start_time as appointment_date,
        u.name as client_name
      FROM notifications n
      LEFT JOIN appointments a ON n.appointment_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${paramIndex}
    `

    const result = await pool.query(query, params)

    res.json({
      success: true,
      count: result.rows.length,
      notifications: result.rows,
    })
  } catch (error) {
    logger.error('Error fetching recent notifications:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent notifications',
    })
  }
}

/**
 * GET /api/notifications/health
 * Health check de servicios de notificación
 */
export const getNotificationHealth = async (req, res) => {
  try {
    const twilioService = req.app.get('twilioService')
    const emailService = req.app.get('emailService')
    const verifyService = req.app.get('verifyService')
    const orchestrator = req.app.get('notificationOrchestrator')

    res.json({
      success: true,
      services: {
        twilio: {
          configured: twilioService?.isConfigured() || false,
          status: twilioService?.isConfigured() ? 'active' : 'disabled',
        },
        email: {
          configured: emailService?.isConfigured() || false,
          status: emailService?.isConfigured() ? 'active' : 'disabled',
        },
        verify: {
          configured: verifyService?.isConfigured() || false,
          status: verifyService?.isConfigured() ? 'active' : 'disabled',
        },
        orchestrator: {
          available: !!orchestrator,
          status: orchestrator ? 'active' : 'unavailable',
        },
      },
    })
  } catch (error) {
    logger.error('Error checking notification health:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check notification health',
    })
  }
}
