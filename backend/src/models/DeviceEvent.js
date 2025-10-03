import pool from '../config/database.js'

export const createEvent = async ({
  deviceId,
  userId = null,
  permissionId = null,
  eventType,
  eventData = {}
}) => {
  let parsedEventType = eventType
  let status = 'success'
  
  if (eventType.includes('_')) {
    const parts = eventType.split('_')
    parsedEventType = parts[0]
    status = parts[1] || 'success'
  }
  
  const itemId = eventData.item_id || null
  const equipmentId = eventData.equipment_id || null
  const errorMessage = eventData.error || null
  
  const result = await pool.query(
    `INSERT INTO device_events (device_id, user_id, permission_id, event_type, status, item_id, equipment_id, telemetry, error_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [deviceId, userId, permissionId, parsedEventType, status, itemId, equipmentId, JSON.stringify(eventData), errorMessage]
  )
  return result.rows[0]
}

export const findEventById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM device_events WHERE id = $1',
    [id]
  )
  return result.rows[0]
}

export const findDeviceEvents = async (deviceId, { page = 1, limit = 50, eventType = null, status = null } = {}) => {
  const offset = (page - 1) * limit
  let query = `SELECT e.*, 
                      u.email as user_email,
                      i.name as item_name,
                      eq.name as equipment_name
               FROM device_events e
               LEFT JOIN users u ON e.user_id = u.id
               LEFT JOIN items i ON e.item_id = i.id
               LEFT JOIN equipment eq ON e.equipment_id = eq.id
               WHERE e.device_id = $1`
  const params = [deviceId]
  let paramCount = 2

  if (eventType) {
    query += ` AND e.event_type = $${paramCount}`
    params.push(eventType)
    paramCount++
  }

  if (status) {
    query += ` AND e.status = $${paramCount}`
    params.push(status)
    paramCount++
  }

  query += ` ORDER BY e.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
  params.push(limit, offset)

  const result = await pool.query(query, params)
  return result.rows
}

export const findUserEvents = async (userId, { page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit
  const result = await pool.query(
    `SELECT e.*, 
            d.device_name,
            i.name as item_name,
            eq.name as equipment_name
     FROM device_events e
     JOIN device_profiles d ON e.device_id = d.id
     LEFT JOIN items i ON e.item_id = i.id
     LEFT JOIN equipment eq ON e.equipment_id = eq.id
     WHERE e.user_id = $1
     ORDER BY e.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  )
  return result.rows
}

export const findEventsByPermission = async (permissionId) => {
  const result = await pool.query(
    `SELECT e.*, 
            d.device_name,
            u.email as user_email
     FROM device_events e
     JOIN device_profiles d ON e.device_id = d.id
     LEFT JOIN users u ON e.user_id = u.id
     WHERE e.permission_id = $1
     ORDER BY e.created_at DESC`,
    [permissionId]
  )
  return result.rows
}

export const findRecentErrors = async ({ deviceId = null, hours = 24, limit = 50 } = {}) => {
  let query = `SELECT e.*, 
                      d.device_name,
                      u.email as user_email
               FROM device_events e
               JOIN device_profiles d ON e.device_id = d.id
               LEFT JOIN users u ON e.user_id = u.id
               WHERE e.status = 'fail'`
  const params = []
  let paramCount = 1

  if (hours) {
    query += ` AND e.created_at >= NOW() - INTERVAL '${hours} hours'`
  }

  if (deviceId) {
    query += ` AND e.device_id = $${paramCount}`
    params.push(deviceId)
    paramCount++
  }

  query += ` ORDER BY e.created_at DESC LIMIT $${paramCount}`
  params.push(limit)

  const result = await pool.query(query, params)
  return result.rows
}

export const getDeviceStats = async (deviceId, { days = 7 } = {}) => {
  let query = `SELECT 
                 event_type,
                 status,
                 COUNT(*) as count
               FROM device_events
               WHERE device_id = $1`
  const params = [deviceId]

  if (days) {
    query += ` AND created_at >= NOW() - INTERVAL '${days} days'`
  }

  query += ' GROUP BY event_type, status ORDER BY event_type, status'

  const result = await pool.query(query, params)
  return result.rows
}
