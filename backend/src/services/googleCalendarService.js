import { google } from 'googleapis'
import pool from '../config/database.js'
import * as AvailabilityBlock from '../models/AvailabilityBlock.js'
import * as Reservation from '../models/Reservation.js'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google-calendar/callback'

/**
 * Crear cliente OAuth2 de Google
 */
const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  )
}

/**
 * Obtener URL de autorización de Google
 */
export const getAuthUrl = (salonId) => {
  const oauth2Client = createOAuth2Client()
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ]

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: salonId,
    prompt: 'consent'
  })
}

/**
 * Intercambiar código por tokens
 */
export const exchangeCodeForTokens = async (code) => {
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

/**
 * Guardar tokens de Google Calendar
 */
export const saveGoogleTokens = async (salonId, tokens) => {
  const expiryDate = new Date(tokens.expiry_date)

  await pool.query(
    `UPDATE salon_profiles
     SET google_refresh_token = $1,
         google_access_token = $2,
         google_token_expiry = $3,
         google_calendar_enabled = true
     WHERE id = $4`,
    [tokens.refresh_token, tokens.access_token, expiryDate, salonId]
  )
}

/**
 * Obtener cliente autenticado de Google Calendar
 */
const getAuthenticatedClient = async (salonId) => {
  const result = await pool.query(
    `SELECT google_refresh_token, google_access_token, google_token_expiry
     FROM salon_profiles
     WHERE id = $1`,
    [salonId]
  )

  if (result.rows.length === 0 || !result.rows[0].google_refresh_token) {
    throw new Error('Google Calendar not configured for this salon')
  }

  const salon = result.rows[0]
  const oauth2Client = createOAuth2Client()

  oauth2Client.setCredentials({
    refresh_token: salon.google_refresh_token,
    access_token: salon.google_access_token
  })

  if (new Date(salon.google_token_expiry) < new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken()
    await saveGoogleTokens(salonId, credentials)
    oauth2Client.setCredentials(credentials)
  }

  return oauth2Client
}

/**
 * Listar calendarios disponibles
 */
export const listCalendars = async (salonId) => {
  const auth = await getAuthenticatedClient(salonId)
  const calendar = google.calendar({ version: 'v3', auth })

  const response = await calendar.calendarList.list()
  return response.data.items
}

/**
 * Configurar calendario principal
 */
export const setPrimaryCalendar = async (salonId, calendarId) => {
  await pool.query(
    `UPDATE salon_profiles
     SET google_calendar_id = $1,
         google_sync_enabled = true
     WHERE id = $2`,
    [calendarId, salonId]
  )
}

/**
 * Sincronizar reservas LOBBA → Google Calendar
 */
export const syncReservationsToGoogle = async (salonId) => {
  const auth = await getAuthenticatedClient(salonId)
  const calendarApi = google.calendar({ version: 'v3', auth })

  const salonResult = await pool.query(
    'SELECT google_calendar_id FROM salon_profiles WHERE id = $1',
    [salonId]
  )

  if (!salonResult.rows[0].google_calendar_id) {
    throw new Error('No calendar configured')
  }

  const calendarId = salonResult.rows[0].google_calendar_id

  const reservations = await pool.query(
    `SELECT r.*, s.name as service_name, u.email as user_email, u.name as user_name
     FROM reservations r
     JOIN salon_services s ON r.service_id = s.id
     JOIN users u ON r.user_id = u.id
     WHERE r.salon_profile_id = $1
       AND r.status IN ('confirmed', 'pending')
       AND r.start_time > NOW()
       AND r.google_event_id IS NULL`,
    [salonId]
  )

  const synced = []

  for (const reservation of reservations.rows) {
    const event = {
      summary: `${reservation.service_name} - ${reservation.user_name}`,
      description: `Reserva LOBBA\nCliente: ${reservation.user_email}\nEstado: ${reservation.status}`,
      start: {
        dateTime: reservation.start_time.toISOString(),
        timeZone: 'Europe/Madrid'
      },
      end: {
        dateTime: reservation.end_time.toISOString(),
        timeZone: 'Europe/Madrid'
      },
      attendees: [
        { email: reservation.user_email }
      ],
      extendedProperties: {
        private: {
          lobba_reservation_id: reservation.id,
          lobba_source: 'true'
        }
      }
    }

    const response = await calendarApi.events.insert({
      calendarId,
      resource: event,
      sendUpdates: 'none'
    })

    await pool.query(
      'UPDATE reservations SET google_event_id = $1 WHERE id = $2',
      [response.data.id, reservation.id]
    )

    synced.push(response.data.id)
  }

  await pool.query(
    'UPDATE salon_profiles SET last_google_sync = NOW() WHERE id = $1',
    [salonId]
  )

  return { synced: synced.length, eventIds: synced }
}

/**
 * Sincronizar eventos Google Calendar → LOBBA (availability_blocks)
 */
export const syncGoogleEventsToBlocks = async (salonId) => {
  const auth = await getAuthenticatedClient(salonId)
  const calendarApi = google.calendar({ version: 'v3', auth })

  const salonResult = await pool.query(
    'SELECT google_calendar_id FROM salon_profiles WHERE id = $1',
    [salonId]
  )

  if (!salonResult.rows[0].google_calendar_id) {
    throw new Error('No calendar configured')
  }

  const calendarId = salonResult.rows[0].google_calendar_id

  const now = new Date()
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3)

  const response = await calendarApi.events.list({
    calendarId,
    timeMin: now.toISOString(),
    timeMax: maxDate.toISOString(),
    singleEvents: true,
    orderBy: 'startTime'
  })

  const events = response.data.items || []
  const blocked = []

  for (const event of events) {
    if (event.extendedProperties?.private?.lobba_source === 'true') {
      continue
    }

    if (!event.start?.dateTime || !event.end?.dateTime) {
      continue
    }

    await AvailabilityBlock.syncGoogleCalendarBlock(salonId, {
      id: event.id,
      start: event.start.dateTime,
      end: event.end.dateTime,
      summary: event.summary || 'Google Calendar Event',
      description: event.description
    })

    blocked.push(event.id)
  }

  return { blocked: blocked.length, eventIds: blocked }
}

/**
 * Sincronización bidireccional completa
 */
export const fullBidirectionalSync = async (salonId) => {
  const toGoogle = await syncReservationsToGoogle(salonId)
  const toBlocks = await syncGoogleEventsToBlocks(salonId)

  return {
    reservationsToGoogle: toGoogle.synced,
    eventsToBlocks: toBlocks.blocked,
    timestamp: new Date().toISOString()
  }
}

/**
 * Configurar webhook de Google Calendar
 */
export const setupWebhook = async (salonId, webhookUrl) => {
  const auth = await getAuthenticatedClient(salonId)
  const calendarApi = google.calendar({ version: 'v3', auth })

  const salonResult = await pool.query(
    'SELECT google_calendar_id FROM salon_profiles WHERE id = $1',
    [salonId]
  )

  if (!salonResult.rows[0].google_calendar_id) {
    throw new Error('No calendar configured')
  }

  const calendarId = salonResult.rows[0].google_calendar_id
  const channelId = `lobba-${salonId}-${Date.now()}`

  const response = await calendarApi.events.watch({
    calendarId,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: webhookUrl
    }
  })

  await pool.query(
    `UPDATE salon_profiles
     SET google_webhook_channel_id = $1,
         google_webhook_resource_id = $2,
         google_webhook_expiration = $3
     WHERE id = $4`,
    [
      response.data.id,
      response.data.resourceId,
      new Date(parseInt(response.data.expiration)),
      salonId
    ]
  )

  return response.data
}

/**
 * Procesar notificación de webhook
 */
export const processWebhookNotification = async (channelId, resourceId) => {
  const salonResult = await pool.query(
    `SELECT id FROM salon_profiles
     WHERE google_webhook_channel_id = $1
       AND google_webhook_resource_id = $2`,
    [channelId, resourceId]
  )

  if (salonResult.rows.length === 0) {
    throw new Error('Webhook not found')
  }

  const salonId = salonResult.rows[0].id

  await syncGoogleEventsToBlocks(salonId)

  return { success: true, salonId }
}
