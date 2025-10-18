import pool from '../config/database.js'

/**
 * Buscar animación de un usuario
 */
export const findByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM user_animations 
     WHERE user_id = $1 AND is_active = true`,
    [userId]
  )

  return result.rows[0] || null
}

/**
 * Crear nueva animación para usuario
 */
export const create = async (userId, data) => {
  const {
    beforeImageUrl,
    afterImageUrl,
    beforeImageThumbnail,
    afterImageThumbnail,
    animationVideoUrl,
    animationType = 'crossfade',
    animationDuration = 2500
  } = data

  const result = await pool.query(
    `INSERT INTO user_animations (
      user_id,
      before_image_url,
      after_image_url,
      before_image_thumbnail,
      after_image_thumbnail,
      animation_video_url,
      animation_type,
      animation_duration
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      userId,
      beforeImageUrl,
      afterImageUrl,
      beforeImageThumbnail || null,
      afterImageThumbnail || null,
      animationVideoUrl || null,
      animationType,
      animationDuration
    ]
  )

  return result.rows[0]
}

/**
 * Actualizar animación existente (upsert)
 */
export const upsert = async (userId, data) => {
  const {
    beforeImageUrl,
    afterImageUrl,
    beforeImageThumbnail,
    afterImageThumbnail,
    animationVideoUrl,
    animationType = 'crossfade',
    animationDuration = 2500
  } = data

  const result = await pool.query(
    `INSERT INTO user_animations (
      user_id,
      before_image_url,
      after_image_url,
      before_image_thumbnail,
      after_image_thumbnail,
      animation_video_url,
      animation_type,
      animation_duration
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (user_id) 
    DO UPDATE SET
      before_image_url = EXCLUDED.before_image_url,
      after_image_url = EXCLUDED.after_image_url,
      before_image_thumbnail = EXCLUDED.before_image_thumbnail,
      after_image_thumbnail = EXCLUDED.after_image_thumbnail,
      animation_video_url = EXCLUDED.animation_video_url,
      animation_type = EXCLUDED.animation_type,
      animation_duration = EXCLUDED.animation_duration,
      is_active = true,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *`,
    [
      userId,
      beforeImageUrl,
      afterImageUrl,
      beforeImageThumbnail || null,
      afterImageThumbnail || null,
      animationVideoUrl || null,
      animationType,
      animationDuration
    ]
  )

  return result.rows[0]
}

/**
 * Actualizar configuración de animación
 */
export const updateSettings = async (userId, settings) => {
  const { animationType, animationDuration, isEnabled } = settings

  const updates = []
  const values = []
  let paramCount = 1

  if (animationType !== undefined) {
    updates.push(`animation_type = $${paramCount++}`)
    values.push(animationType)
  }

  if (animationDuration !== undefined) {
    updates.push(`animation_duration = $${paramCount++}`)
    values.push(animationDuration)
  }

  if (isEnabled !== undefined) {
    updates.push(`is_active = $${paramCount++}`)
    values.push(isEnabled)
  }

  if (updates.length === 0) {
    return null
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`)
  values.push(userId)

  const result = await pool.query(
    `UPDATE user_animations 
     SET ${updates.join(', ')}
     WHERE user_id = $${paramCount}
     RETURNING *`,
    values
  )

  return result.rows[0] || null
}

/**
 * Marcar animación como inactiva (soft delete)
 */
export const deactivate = async (userId) => {
  const result = await pool.query(
    `UPDATE user_animations 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1
     RETURNING *`,
    [userId]
  )

  return result.rows[0] || null
}

/**
 * Eliminar animación permanentemente (hard delete)
 */
export const deleteAnimationPermanently = async (userId) => {
  const result = await pool.query(
    `DELETE FROM user_animations 
     WHERE user_id = $1
     RETURNING *`,
    [userId]
  )

  return result.rows[0] || null
}

/**
 * Actualizar flag en tabla users
 */
export const setUserAnimationFlag = async (userId, hasAnimation) => {
  await pool.query(
    `UPDATE users 
     SET has_custom_animation = $1
     WHERE id = $2`,
    [hasAnimation, userId]
  )
}

/**
 * Verificar si usuario tiene animación activa
 */
export const hasActiveAnimation = async (userId) => {
  const result = await pool.query(
    `SELECT EXISTS(
      SELECT 1 FROM user_animations 
      WHERE user_id = $1 AND is_active = true
    ) as has_animation`,
    [userId]
  )

  return result.rows[0]?.has_animation || false
}
