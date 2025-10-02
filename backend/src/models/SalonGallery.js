import pool from '../config/database.js'

export const createGalleryImage = async ({
  salonProfileId,
  cloudinaryPublicId,
  cloudinaryUrl,
  title,
  description,
  sortOrder,
}) => {
  const result = await pool.query(
    `INSERT INTO salon_gallery 
     (salon_profile_id, cloudinary_public_id, cloudinary_url, title, description, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      salonProfileId,
      cloudinaryPublicId,
      cloudinaryUrl,
      title || null,
      description || null,
      sortOrder || 0,
    ]
  )
  return result.rows[0]
}

export const findGalleryImageById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM salon_gallery WHERE id = $1`,
    [id]
  )
  return result.rows[0]
}

export const findGalleryImagesBySalonId = async (salonProfileId) => {
  const result = await pool.query(
    `SELECT * FROM salon_gallery 
     WHERE salon_profile_id = $1 
     ORDER BY is_cover DESC, sort_order ASC`,
    [salonProfileId]
  )
  return result.rows
}

export const updateGalleryImage = async (id, updates) => {
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
    return await findGalleryImageById(id)
  }

  values.push(id)

  const result = await pool.query(
    `UPDATE salon_gallery 
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )

  return result.rows[0]
}

export const deleteGalleryImage = async (id) => {
  const result = await pool.query(
    `DELETE FROM salon_gallery 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export const setImageAsCover = async (salonProfileId, imageId) => {
  await pool.query(
    `UPDATE salon_gallery 
     SET is_cover = false 
     WHERE salon_profile_id = $1`,
    [salonProfileId]
  )

  const result = await pool.query(
    `UPDATE salon_gallery 
     SET is_cover = true, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [imageId]
  )

  return result.rows[0]
}
