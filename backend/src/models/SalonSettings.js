import pool from '../config/database.js'

/**
 * Obtener configuración de un salón (crear si no existe)
 */
export const getSalonSettings = async (salonProfileId) => {
  const result = await pool.query(
    `SELECT * FROM salon_settings WHERE salon_profile_id = $1`,
    [salonProfileId]
  )

  if (result.rows.length > 0) {
    return result.rows[0]
  }

  const newSettings = await pool.query(
    `INSERT INTO salon_settings (salon_profile_id)
     VALUES ($1)
     RETURNING *`,
    [salonProfileId]
  )

  return newSettings.rows[0]
}

/**
 * Actualizar configuración de un salón
 */
export const updateSalonSettings = async (salonProfileId, settings) => {
  const fields = []
  const values = []
  let paramCount = 1

  const allowedFields = [
    'auto_confirm_enabled',
    'auto_confirm_min_hours',
    'require_manual_first_booking',
    'manual_approval_services',
    'buffer_minutes',
    'max_advance_booking_days',
    'min_advance_booking_hours',
    'allow_user_cancellation',
    'cancellation_min_hours',
    'send_confirmation_email',
    'send_reminder_whatsapp',
    'reminder_hours_before'
  ]

  for (const [key, value] of Object.entries(settings)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramCount}`)
      values.push(value)
      paramCount++
    }
  }

  if (fields.length === 0) {
    throw new Error('No valid fields to update')
  }

  values.push(salonProfileId)

  const result = await pool.query(
    `UPDATE salon_settings
     SET ${fields.join(', ')}
     WHERE salon_profile_id = $${paramCount}
     RETURNING *`,
    values
  )

  if (result.rows.length === 0) {
    await pool.query(
      `INSERT INTO salon_settings (salon_profile_id)
       VALUES ($1)`,
      [salonProfileId]
    )

    return updateSalonSettings(salonProfileId, settings)
  }

  return result.rows[0]
}

/**
 * Verificar si un servicio requiere aprobación manual
 */
export const requiresManualApproval = async (salonProfileId, serviceId) => {
  const settings = await getSalonSettings(salonProfileId)

  if (!settings.auto_confirm_enabled) {
    return true
  }

  const manualServices = settings.manual_approval_services || []
  return manualServices.includes(serviceId)
}

/**
 * Obtener minutos de buffer del salón
 */
export const getBufferMinutes = async (salonProfileId) => {
  const settings = await getSalonSettings(salonProfileId)
  return settings.buffer_minutes || 15
}
