import * as GoogleCalendar from '../services/googleCalendarService.js'
import pool from '../config/database.js'

/**
 * Iniciar autorización con Google Calendar
 */
export const initiateAuth = async (req, res) => {
  try {
    const { salonId } = req.params
    const userId = req.user?.id

    const salonResult = await pool.query('SELECT user_id FROM salon_profiles WHERE id = $1', [
      salonId,
    ])

    if (salonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' })
    }

    if (salonResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const authUrl = GoogleCalendar.getAuthUrl(salonId)

    return res.status(200).json({
      success: true,
      authUrl,
    })
  } catch (error) {
    console.error('Error initiating Google auth:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Callback de OAuth2 de Google
 */
export const handleCallback = async (req, res) => {
  try {
    const { code, state: salonId, error } = req.query

    if (error) {
      console.error('❌ [Google Calendar] OAuth error from Google:', error)
      const redirectUrl = salonId
        ? `${process.env.FRONTEND_URL}/salon/${salonId}/settings?error=google_auth_failed&reason=${error}`
        : `${process.env.FRONTEND_URL}/?error=google_auth_failed&reason=${error}`
      return res.redirect(redirectUrl)
    }

    if (!code || !salonId) {
      console.error('❌ [Google Calendar] Missing code or state')
      return res.status(400).json({ error: 'Missing code or state' })
    }

    const tokens = await GoogleCalendar.exchangeCodeForTokens(code)
    await GoogleCalendar.saveGoogleTokens(salonId, tokens)

    return res.redirect(
      `${process.env.FRONTEND_URL}/salon/${salonId}/settings?google_calendar=connected`
    )
  } catch (error) {
    const { state: salonId } = req.query
    console.error('❌ [Google Calendar] Error handling callback:', {
      salonId,
      message: error.message,
      stack: error.stack,
      code: error.code,
      response: error.response?.data,
    })
    const redirectUrl = salonId
      ? `${process.env.FRONTEND_URL}/salon/${salonId}/settings?error=google_auth_failed`
      : `${process.env.FRONTEND_URL}/?error=google_auth_failed`
    return res.redirect(redirectUrl)
  }
}

/**
 * Listar calendarios disponibles
 */
export const getCalendars = async (req, res) => {
  try {
    const { salonId } = req.params
    const userId = req.user?.id

    const salonResult = await pool.query('SELECT user_id FROM salon_profiles WHERE id = $1', [
      salonId,
    ])

    if (salonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' })
    }

    if (salonResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const calendars = await GoogleCalendar.listCalendars(salonId)

    return res.status(200).json({
      success: true,
      calendars,
    })
  } catch (error) {
    console.error('Error getting calendars:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Configurar calendario principal
 */
export const setCalendar = async (req, res) => {
  try {
    const { salonId } = req.params
    const { calendarId } = req.body
    const userId = req.user?.id

    if (!calendarId) {
      return res.status(400).json({ error: 'Calendar ID is required' })
    }

    const salonResult = await pool.query('SELECT user_id FROM salon_profiles WHERE id = $1', [
      salonId,
    ])

    if (salonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' })
    }

    if (salonResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await GoogleCalendar.setPrimaryCalendar(salonId, calendarId)

    return res.status(200).json({
      success: true,
      message: 'Calendar configured successfully',
    })
  } catch (error) {
    console.error('Error setting calendar:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Sincronizar manualmente
 */
export const syncNow = async (req, res) => {
  try {
    const { salonId } = req.params
    const userId = req.user?.id

    const salonResult = await pool.query('SELECT user_id FROM salon_profiles WHERE id = $1', [
      salonId,
    ])

    if (salonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' })
    }

    if (salonResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const result = await GoogleCalendar.fullBidirectionalSync(salonId)

    return res.status(200).json({
      success: true,
      sync: result,
    })
  } catch (error) {
    console.error('Error syncing calendar:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Configurar webhook
 */
export const setupWebhook = async (req, res) => {
  try {
    const { salonId } = req.params
    const userId = req.user?.id

    console.log('🔔 [Webhook Setup] Starting for salon:', salonId)

    const salonResult = await pool.query('SELECT user_id FROM salon_profiles WHERE id = $1', [
      salonId,
    ])

    if (salonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' })
    }

    if (salonResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const webhookUrl = `${process.env.BACKEND_URL}/api/google-calendar/webhook`
    console.log('🔔 [Webhook Setup] URL:', webhookUrl)

    const webhook = await GoogleCalendar.setupWebhook(salonId, webhookUrl)

    console.log('✅ [Webhook Setup] Success:', {
      channelId: webhook.id,
      resourceId: webhook.resourceId,
      expiration: new Date(parseInt(webhook.expiration)),
    })

    return res.status(200).json({
      success: true,
      webhook,
    })
  } catch (error) {
    console.error('❌ [Webhook Setup] Error:', {
      salonId: req.params.salonId,
      message: error.message,
      stack: error.stack,
    })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Recibir notificaciones de webhook
 */
export const handleWebhook = async (req, res) => {
  try {
    const channelId = req.headers['x-goog-channel-id']
    const resourceId = req.headers['x-goog-resource-id']
    const resourceState = req.headers['x-goog-resource-state']

    console.log('📨 [Webhook] Notification received:', {
      channelId,
      resourceId,
      resourceState,
      headers: req.headers,
    })

    if (!channelId || !resourceId) {
      console.error('❌ [Webhook] Missing headers')
      return res.status(400).json({ error: 'Missing webhook headers' })
    }

    // Si es solo una verificación de sincronización, responder OK sin procesar
    if (resourceState === 'sync') {
      console.log('✅ [Webhook] Sync verification - responding OK')
      return res.status(200).json({ success: true })
    }

    console.log('🔄 [Webhook] Processing notification...')
    await GoogleCalendar.processWebhookNotification(channelId, resourceId)
    console.log('✅ [Webhook] Notification processed successfully')

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('❌ [Webhook] Error processing:', {
      message: error.message,
      stack: error.stack,
      channelId: req.headers['x-goog-channel-id'],
      resourceId: req.headers['x-goog-resource-id'],
    })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Forzar renovación manual de webhook
 */
export const forceRenewal = async (req, res) => {
  try {
    const { salonId } = req.params
    const userId = req.user?.id

    console.log('🔧 [Force Renewal] Manual renewal requested for salon:', salonId)

    const salonResult = await pool.query('SELECT user_id FROM salon_profiles WHERE id = $1', [
      salonId,
    ])

    if (salonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' })
    }

    if (salonResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const webhookUrl = `${process.env.BACKEND_URL}/api/google-calendar/webhook`
    const webhook = await GoogleCalendar.setupWebhook(salonId, webhookUrl)

    console.log('✅ [Force Renewal] Webhook renewed successfully for salon:', salonId)

    return res.status(200).json({
      success: true,
      webhook: {
        channelId: webhook.id,
        expiration: new Date(parseInt(webhook.expiration)).toISOString(),
      },
      message: 'Webhook renewed successfully',
    })
  } catch (error) {
    console.error('Error renewing webhook:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Desconectar Google Calendar
 */
export const disconnect = async (req, res) => {
  try {
    const { salonId } = req.params
    const userId = req.user?.id

    const salonResult = await pool.query('SELECT user_id FROM salon_profiles WHERE id = $1', [
      salonId,
    ])

    if (salonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' })
    }

    if (salonResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await pool.query(
      `UPDATE salon_profiles
       SET google_calendar_id = NULL,
           google_calendar_enabled = false,
           google_sync_enabled = false,
           google_refresh_token = NULL,
           google_access_token = NULL,
           google_token_expiry = NULL,
           google_webhook_channel_id = NULL,
           google_webhook_resource_id = NULL,
           google_webhook_expiration = NULL
       WHERE id = $1`,
      [salonId]
    )

    return res.status(200).json({
      success: true,
      message: 'Google Calendar disconnected',
    })
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
