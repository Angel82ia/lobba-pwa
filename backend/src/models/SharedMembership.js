import pool from '../config/database.js'

export const createSharedMembership = async ({ membershipId, sharedWithName, sharedWithBirthdate, relation, createdBy }) => {
  const result = await pool.query(
    `INSERT INTO shared_memberships (membership_id, shared_with_name, shared_with_birthdate, relation, created_by, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [membershipId, sharedWithName, sharedWithBirthdate, relation, createdBy, 'active']
  )
  return result.rows[0]
}

export const findSharedMembershipById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM shared_memberships WHERE id = $1',
    [id]
  )
  return result.rows[0]
}

export const findSharedMembershipByMembershipId = async (membershipId) => {
  const result = await pool.query(
    `SELECT * FROM shared_memberships 
     WHERE membership_id = $1 AND status = 'active' 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [membershipId]
  )
  return result.rows[0]
}

export const findSharedMembershipsByCreatedBy = async (createdBy) => {
  const result = await pool.query(
    `SELECT sm.*, m.plan_type, m.status as membership_status 
     FROM shared_memberships sm
     JOIN memberships m ON sm.membership_id = m.id
     WHERE sm.created_by = $1 
     ORDER BY sm.created_at DESC`,
    [createdBy]
  )
  return result.rows
}

export const updateSharedMembership = async (id, updates) => {
  const fields = []
  const values = []
  let paramCount = 1

  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = $${paramCount}`)
    values.push(value)
    paramCount++
  })

  values.push(id)
  
  const result = await pool.query(
    `UPDATE shared_memberships SET ${fields.join(', ')}, updated_at = now() WHERE id = $${paramCount} RETURNING *`,
    values
  )
  return result.rows[0]
}

export const revokeSharedMembership = async (id) => {
  const result = await pool.query(
    `UPDATE shared_memberships SET status = 'revoked', updated_at = now() WHERE id = $1 RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export const checkDuplicateActive = async (membershipId, sharedWithName) => {
  const result = await pool.query(
    `SELECT * FROM shared_memberships 
     WHERE membership_id = $1 AND shared_with_name = $2 AND status = 'active'`,
    [membershipId, sharedWithName]
  )
  return result.rows[0]
}
