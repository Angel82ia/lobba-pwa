import pool from '../config/database.js'
import nodemailer from 'nodemailer'

/**
 * Sanitizar texto para prevenir XSS
 * Remueve tags HTML y caracteres peligrosos
 */
const sanitizeText = text => {
  if (!text) return ''

  // Convertir a string
  let sanitized = String(text)

  // Remover tags HTML completos
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  // Remover scripts y eventos
  sanitized = sanitized.replace(/javascript:/gi, '')
  sanitized = sanitized.replace(/on\w+\s*=/gi, '')

  // Escapar caracteres HTML especiales
  const htmlEntities = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  sanitized = sanitized.replace(/[<>"'/]/g, char => htmlEntities[char])

  return sanitized
}

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@lobba.com'
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = process.env.SMTP_PORT || 587
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === '465',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
})

/**
 * Obtener template de notificación
 */
export const getTemplate = async templateKey => {
  const result = await pool.query(
    `SELECT * FROM notification_templates
     WHERE template_key = $1 AND is_active = true`,
    [templateKey]
  )

  if (result.rows.length === 0) {
    throw new Error(`Template not found: ${templateKey}`)
  }

  return result.rows[0]
}

/**
 * Renderizar template con variables
 * @param {string} template - Template con placeholders {{variable}}
 * @param {Object} variables - Variables a reemplazar
 * @param {boolean} escapeHtml - Si debe sanitizar HTML (default: true)
 * @returns {string} Template renderizado y sanitizado
 */
export const renderTemplate = (template, variables, escapeHtml = true) => {
  // Extraer variables requeridas del template
  const requiredVars = new Set()
  const varRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g
  let match

  while ((match = varRegex.exec(template)) !== null) {
    requiredVars.add(match[1])
  }

  // Validar que todas las variables requeridas están presentes
  const missingVars = []
  const providedVariables = { ...variables }

  for (const varName of requiredVars) {
    if (
      !(varName in providedVariables) ||
      providedVariables[varName] === null ||
      providedVariables[varName] === undefined
    ) {
      missingVars.push(varName)
      // Usar placeholder visible en lugar de valor vacío
      providedVariables[varName] = `[${varName}]`
    }
  }

  if (missingVars.length > 0) {
    console.warn('Template missing variables:', {
      template: template.substring(0, 100),
      missingVars,
    })
  }

  // Renderizar template con sanitización
  let rendered = template

  for (const [key, value] of Object.entries(providedVariables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')

    // Convertir a string y sanitizar si es HTML
    let sanitizedValue = String(value || '')

    if (escapeHtml) {
      // Sanitizar XSS attacks
      sanitizedValue = sanitizeText(sanitizedValue)
    }

    rendered = rendered.replace(regex, sanitizedValue)
  }

  // Verificar que no quedan variables sin reemplazar
  const unreplacedVars = rendered.match(/\{\{[a-zA-Z0-9_]+\}\}/g)
  if (unreplacedVars) {
    console.error('Unresolved variables in template:', {
      template: template.substring(0, 100),
      unreplacedVars,
    })
  }

  return rendered
}

/**
 * Enviar email
 */
export const sendEmail = async (to, subject, body) => {
  try {
    if (!SMTP_HOST || !SMTP_USER) {
      console.warn('SMTP not configured, skipping email send')
      return { success: false, reason: 'SMTP not configured' }
    }

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Enviar notificación usando template
 */
export const sendNotification = async (templateKey, recipient, variables) => {
  try {
    const template = await getTemplate(templateKey)

    if (!template) {
      throw new Error(`Template ${templateKey} not found`)
    }

    const body = renderTemplate(template.body_template, variables)
    const subject = template.subject ? renderTemplate(template.subject, variables) : null

    let result

    switch (template.notification_type) {
      case 'email':
        result = await sendEmail(recipient, subject, body)
        break

      case 'whatsapp':
        result = { success: false, reason: 'WhatsApp integration not yet implemented' }
        break

      case 'push':
        result = await sendPushNotification(recipient, subject, body)
        break

      case 'sms':
        result = { success: false, reason: 'SMS integration not yet implemented' }
        break

      default:
        throw new Error(`Unknown notification type: ${template.notification_type}`)
    }

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, sent_via, sent_at, metadata)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
      [
        recipient,
        templateKey,
        subject,
        body,
        template.notification_type,
        JSON.stringify({ template_key: templateKey, variables }),
      ]
    )

    return result
  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
}

/**
 * Enviar push notification (usa tabla existente fcm_tokens)
 */
const sendPushNotification = async (userId, _title, _body) => {
  try {
    const tokensResult = await pool.query(
      'SELECT token FROM fcm_tokens WHERE user_id = $1 AND is_active = true',
      [userId]
    )

    if (tokensResult.rows.length === 0) {
      return { success: false, reason: 'No FCM tokens found' }
    }

    return { success: true, tokens: tokensResult.rows.length }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Notificaciones específicas para reservas
 */

export const notifyReservationCreated = async reservation => {
  const serviceResult = await pool.query(
    `SELECT s.name as service_name, sp.business_name as salon_name, sp.user_id as salon_owner_id
     FROM salon_services s
     JOIN salon_profiles sp ON s.salon_profile_id = sp.id
     WHERE s.id = $1`,
    [reservation.service_id]
  )

  const userResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [
    reservation.user_id,
  ])

  if (serviceResult.rows.length === 0 || userResult.rows.length === 0) {
    return
  }

  const service = serviceResult.rows[0]
  const user = userResult.rows[0]

  const variables = {
    user_name: user.name,
    salon_name: service.salon_name,
    service_name: service.service_name,
    start_time: new Date(reservation.start_time).toLocaleString('es-ES'),
    total_price: reservation.total_price,
    status: reservation.status,
  }

  await sendNotification('reservation_created', user.email, variables)

  await sendNotification('new_reservation_salon', service.salon_owner_id, {
    ...variables,
    user_email: user.email,
  })
}

export const notifyReservationConfirmed = async reservation => {
  const serviceResult = await pool.query(
    `SELECT s.name as service_name, sp.business_name as salon_name
     FROM salon_services s
     JOIN salon_profiles sp ON s.salon_profile_id = sp.id
     WHERE s.id = $1`,
    [reservation.service_id]
  )

  const userResult = await pool.query('SELECT name, phone FROM users WHERE id = $1', [
    reservation.user_id,
  ])

  if (serviceResult.rows.length === 0 || userResult.rows.length === 0) {
    return
  }

  const service = serviceResult.rows[0]
  const user = userResult.rows[0]

  const variables = {
    user_name: user.name,
    salon_name: service.salon_name,
    service_name: service.service_name,
    start_time: new Date(reservation.start_time).toLocaleString('es-ES'),
    total_price: reservation.total_price,
  }

  await sendNotification('reservation_confirmed', user.phone || reservation.user_id, variables)
}

export const notifyReservationCancelled = async (reservation, reason) => {
  const serviceResult = await pool.query(
    `SELECT s.name as service_name, sp.business_name as salon_name
     FROM salon_services s
     JOIN salon_profiles sp ON s.salon_profile_id = sp.id
     WHERE s.id = $1`,
    [reservation.service_id]
  )

  const userResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [
    reservation.user_id,
  ])

  if (serviceResult.rows.length === 0 || userResult.rows.length === 0) {
    return
  }

  const service = serviceResult.rows[0]
  const user = userResult.rows[0]

  const variables = {
    user_name: user.name,
    salon_name: service.salon_name,
    start_time: new Date(reservation.start_time).toLocaleString('es-ES'),
    reason: reason || 'No especificada',
  }

  await sendNotification('reservation_cancelled', user.email, variables)
}

export const notifyReservationModified = async (reservation, changes) => {
  const serviceResult = await pool.query(
    `SELECT s.name as service_name, sp.business_name as salon_name
     FROM salon_services s
     JOIN salon_profiles sp ON s.salon_profile_id = sp.id
     WHERE s.id = $1`,
    [reservation.service_id]
  )

  const userResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [
    reservation.user_id,
  ])

  if (serviceResult.rows.length === 0 || userResult.rows.length === 0) {
    return
  }

  const service = serviceResult.rows[0]
  const user = userResult.rows[0]

  const variables = {
    user_name: user.name,
    salon_name: service.salon_name,
    old_start_time: changes.start_time?.from
      ? new Date(changes.start_time.from).toLocaleString('es-ES')
      : 'N/A',
    old_service_name: changes.service?.from || service.service_name,
    new_start_time: changes.start_time?.to
      ? new Date(changes.start_time.to).toLocaleString('es-ES')
      : 'N/A',
    new_service_name: changes.service?.to || service.service_name,
  }

  await sendNotification('reservation_modified', user.email, variables)
}
