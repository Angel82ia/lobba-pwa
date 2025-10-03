import pool from '../config/database.js'

export const createPermission = async ({
  userId,
  deviceId,
  itemId = null,
  equipmentId = null,
  permissionType,
  token,
  expiresAt
}) => {
  const result = await pool.query(
    `INSERT INTO use_permissions (user_id, device_id, item_id, equipment_id, permission_type, token, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, deviceId, itemId, equipmentId, permissionType, token, expiresAt]
  )
  return result.rows[0]
}

export const findPermissionById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM use_permissions WHERE id = $1',
    [id]
  )
  return result.rows[0]
}

export const findPermissionByToken = async (token) => {
  const result = await pool.query(
    'SELECT * FROM use_permissions WHERE token = $1',
    [token]
  )
  return result.rows[0]
}

export const findUserPermissions = async (userId, status = null) => {
  let query = `SELECT p.*, 
                      i.name as item_name,
                      e.name as equipment_name
               FROM use_permissions p
               LEFT JOIN items i ON p.item_id = i.id
               LEFT JOIN equipment e ON p.equipment_id = e.id
               WHERE p.user_id = $1`
  const params = [userId]

  if (status) {
    query += ' AND p.status = $2'
    params.push(status)
  }

  query += ' ORDER BY p.created_at DESC'

  const result = await pool.query(query, params)
  return result.rows
}

export const findDevicePermissions = async (deviceId, status = null) => {
  let query = `SELECT p.*, 
                      u.email as user_email,
                      i.name as item_name,
                      e.name as equipment_name
               FROM use_permissions p
               JOIN users u ON p.user_id = u.id
               LEFT JOIN items i ON p.item_id = i.id
               LEFT JOIN equipment e ON p.equipment_id = e.id
               WHERE p.device_id = $1`
  const params = [deviceId]

  if (status) {
    query += ' AND p.status = $2'
    params.push(status)
  }

  query += ' ORDER BY p.created_at DESC'

  const result = await pool.query(query, params)
  return result.rows
}

export const updatePermissionStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE use_permissions 
     SET status = $1, used_at = CASE WHEN $1 = 'used' THEN CURRENT_TIMESTAMP ELSE used_at END
     WHERE id = $2 
     RETURNING *`,
    [status, id]
  )
  return result.rows[0]
}

export const validatePermission = async (token) => {
  const result = await pool.query(
    `SELECT p.*, 
            i.name as item_name, i.is_consumable,
            e.name as equipment_name, e.requires_return,
            d.device_name, d.device_type
     FROM use_permissions p
     LEFT JOIN items i ON p.item_id = i.id
     LEFT JOIN equipment e ON p.equipment_id = e.id
     JOIN device_profiles d ON p.device_id = d.id
     WHERE p.token = $1 
       AND p.status = 'pending'
       AND p.expires_at > CURRENT_TIMESTAMP`,
    [token]
  )
  return result.rows[0]
}

export const expireOldPermissions = async () => {
  const result = await pool.query(
    `UPDATE use_permissions 
     SET status = 'expired' 
     WHERE status = 'pending' 
       AND expires_at < CURRENT_TIMESTAMP 
     RETURNING *`
  )
  return result.rows
}

export const cancelPermission = async (id) => {
  const result = await pool.query(
    `UPDATE use_permissions 
     SET status = 'cancelled' 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}
