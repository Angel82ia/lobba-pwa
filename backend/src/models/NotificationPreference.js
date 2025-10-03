import pool from '../config/database.js'

export const findPreferenceByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM user_notification_preferences WHERE user_id = $1',
    [userId]
  )
  return result.rows[0]
}

export const createPreference = async ({ userId, notificationsEnabled, typesEnabled, maxRadiusKm }) => {
  const result = await pool.query(
    `INSERT INTO user_notification_preferences 
     (user_id, notifications_enabled, types_enabled, max_radius_km)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, notificationsEnabled, typesEnabled, maxRadiusKm]
  )
  return result.rows[0]
}

export const updatePreference = async (userId, updates) => {
  const fields = []
  const values = []
  let paramCount = 1

  Object.entries(updates).forEach(([key, value]) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    fields.push(`${snakeKey} = $${paramCount}`)
    values.push(value)
    paramCount++
  })

  if (fields.length === 0) {
    return await findPreferenceByUserId(userId)
  }

  values.push(userId)

  const result = await pool.query(
    `UPDATE user_notification_preferences 
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE user_id = $${paramCount} 
     RETURNING *`,
    values
  )
  return result.rows[0]
}

export const getOrCreatePreference = async (userId) => {
  let preference = await findPreferenceByUserId(userId)
  if (!preference) {
    preference = await createPreference({
      userId,
      notificationsEnabled: true,
      typesEnabled: ['oferta', 'evento', 'descuento', 'noticia'],
      maxRadiusKm: 50,
    })
  }
  return preference
}
