import pool from '../config/database.js'

/**
 * Crear un bloqueo de disponibilidad
 */
export const createBlock = async (blockData) => {
  const {
    salonProfileId,
    startTime,
    endTime,
    blockType = 'manual',
    title,
    description,
    googleCalendarEventId,
    createdBy
  } = blockData

  const result = await pool.query(
    `INSERT INTO availability_blocks (
      salon_profile_id, start_time, end_time, block_type,
      title, description, google_calendar_event_id, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [salonProfileId, startTime, endTime, blockType, title, description, googleCalendarEventId, createdBy]
  )

  return result.rows[0]
}

/**
 * Obtener bloqueos de un salón en un rango de tiempo
 */
export const getBlocksInRange = async (salonProfileId, startTime, endTime) => {
  const result = await pool.query(
    `SELECT * FROM availability_blocks
     WHERE salon_profile_id = $1
       AND is_active = true
       AND (
         (start_time <= $3 AND end_time > $2)
         OR (start_time < $3 AND end_time >= $3)
         OR (start_time >= $2 AND end_time <= $3)
       )
     ORDER BY start_time`,
    [salonProfileId, startTime, endTime]
  )

  return result.rows
}

/**
 * Verificar si un slot está bloqueado
 */
export const isSlotBlocked = async (salonProfileId, startTime, endTime) => {
  const blocks = await getBlocksInRange(salonProfileId, startTime, endTime)
  return blocks.length > 0
}

/**
 * Obtener todos los bloqueos de un salón
 */
export const getSalonBlocks = async (salonProfileId, activeOnly = true) => {
  let query = `SELECT * FROM availability_blocks WHERE salon_profile_id = $1`
  
  if (activeOnly) {
    query += ' AND is_active = true'
  }
  
  query += ' ORDER BY start_time DESC'

  const result = await pool.query(query, [salonProfileId])
  return result.rows
}

/**
 * Actualizar un bloqueo
 */
export const updateBlock = async (blockId, updates) => {
  const fields = []
  const values = []
  let paramCount = 1

  const allowedFields = [
    'start_time',
    'end_time',
    'block_type',
    'title',
    'description',
    'is_active'
  ]

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramCount}`)
      values.push(value)
      paramCount++
    }
  }

  if (fields.length === 0) {
    throw new Error('No valid fields to update')
  }

  values.push(blockId)

  const result = await pool.query(
    `UPDATE availability_blocks
     SET ${fields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  )

  return result.rows[0]
}

/**
 * Eliminar un bloqueo (soft delete)
 */
export const deleteBlock = async (blockId) => {
  const result = await pool.query(
    `UPDATE availability_blocks
     SET is_active = false
     WHERE id = $1
     RETURNING *`,
    [blockId]
  )

  return result.rows[0]
}

/**
 * Eliminar bloqueo permanentemente
 */
export const permanentDeleteBlock = async (blockId) => {
  await pool.query(
    'DELETE FROM availability_blocks WHERE id = $1',
    [blockId]
  )
}

/**
 * Obtener bloqueo por Google Calendar event ID
 */
export const getBlockByGoogleEventId = async (salonProfileId, eventId) => {
  const result = await pool.query(
    `SELECT * FROM availability_blocks
     WHERE salon_profile_id = $1
       AND google_calendar_event_id = $2`,
    [salonProfileId, eventId]
  )

  return result.rows[0]
}

/**
 * Crear o actualizar bloqueo desde Google Calendar
 */
export const syncGoogleCalendarBlock = async (salonProfileId, eventData) => {
  const existing = await getBlockByGoogleEventId(salonProfileId, eventData.id)

  if (existing) {
    return updateBlock(existing.id, {
      start_time: eventData.start,
      end_time: eventData.end,
      title: eventData.summary,
      description: eventData.description
    })
  } else {
    return createBlock({
      salonProfileId,
      startTime: eventData.start,
      endTime: eventData.end,
      blockType: 'google_calendar',
      title: eventData.summary,
      description: eventData.description,
      googleCalendarEventId: eventData.id
    })
  }
}
