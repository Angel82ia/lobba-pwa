import pool from '../config/database.js'

export const createCategory = async ({
  name,
  slug,
  description,
  icon,
  parentCategoryId,
  sortOrder,
}) => {
  const result = await pool.query(
    `INSERT INTO salon_categories 
     (name, slug, description, icon, parent_category_id, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, slug, description || null, icon || null, parentCategoryId || null, sortOrder || 0]
  )
  return result.rows[0]
}

export const findAllCategories = async ({ includeInactive = false } = {}) => {
  let query = `SELECT * FROM salon_categories`
  
  if (!includeInactive) {
    query += ` WHERE is_active = true`
  }
  
  query += ` ORDER BY sort_order ASC, name ASC`
  
  const result = await pool.query(query, [])
  return result.rows
}

export const findCategoryById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM salon_categories WHERE id = $1`,
    [id]
  )
  return result.rows[0]
}

export const findCategoryBySlug = async (slug) => {
  const result = await pool.query(
    `SELECT * FROM salon_categories WHERE slug = $1`,
    [slug]
  )
  return result.rows[0]
}

export const updateCategory = async (id, updates) => {
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
    return await findCategoryById(id)
  }

  values.push(id)

  const result = await pool.query(
    `UPDATE salon_categories 
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )

  return result.rows[0]
}

export const deleteCategory = async (id) => {
  const result = await pool.query(
    `UPDATE salon_categories 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export const assignCategoryToSalon = async (salonProfileId, categoryId) => {
  const result = await pool.query(
    `INSERT INTO salon_category_assignments 
     (salon_profile_id, category_id)
     VALUES ($1, $2)
     ON CONFLICT (salon_profile_id, category_id) DO NOTHING
     RETURNING *`,
    [salonProfileId, categoryId]
  )
  return result.rows[0]
}

export const removeCategoryFromSalon = async (salonProfileId, categoryId) => {
  const result = await pool.query(
    `DELETE FROM salon_category_assignments 
     WHERE salon_profile_id = $1 AND category_id = $2
     RETURNING *`,
    [salonProfileId, categoryId]
  )
  return result.rows[0]
}

export const getSalonCategories = async (salonProfileId) => {
  const result = await pool.query(
    `SELECT sc.* 
     FROM salon_categories sc
     JOIN salon_category_assignments sca ON sc.id = sca.category_id
     WHERE sca.salon_profile_id = $1 AND sc.is_active = true
     ORDER BY sc.sort_order ASC, sc.name ASC`,
    [salonProfileId]
  )
  return result.rows
}
