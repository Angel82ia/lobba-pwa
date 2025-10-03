import pool from '../config/database.js'

export const createAuditLog = async ({
  userId,
  action,
  resourceType,
  resourceId,
  details,
  ipAddress,
  userAgent
}) => {
  const result = await pool.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, action, resourceType, resourceId, JSON.stringify(details), ipAddress, userAgent]
  )
  return result.rows[0]
}

export const findAuditLogs = async ({ 
  userId = null, 
  action = null, 
  resourceType = null,
  startDate = null,
  endDate = null,
  page = 1, 
  limit = 50 
} = {}) => {
  let query = 'SELECT a.*, u.email as user_email FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id WHERE 1=1'
  const params = []
  let paramCount = 1

  if (userId) {
    query += ` AND a.user_id = $${paramCount}`
    params.push(userId)
    paramCount++
  }

  if (action) {
    query += ` AND a.action = $${paramCount}`
    params.push(action)
    paramCount++
  }

  if (resourceType) {
    query += ` AND a.resource_type = $${paramCount}`
    params.push(resourceType)
    paramCount++
  }

  if (startDate) {
    query += ` AND a.created_at >= $${paramCount}`
    params.push(startDate)
    paramCount++
  }

  if (endDate) {
    query += ` AND a.created_at <= $${paramCount}`
    params.push(endDate)
    paramCount++
  }

  const offset = (page - 1) * limit
  query += ` ORDER BY a.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
  params.push(limit, offset)

  const result = await pool.query(query, params)
  return result.rows
}

export const getAuditStats = async (days = 30) => {
  const result = await pool.query(
    `SELECT 
       action,
       COUNT(*) as count,
       DATE_TRUNC('day', created_at) as day
     FROM audit_logs
     WHERE created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY action, DATE_TRUNC('day', created_at)
     ORDER BY day DESC, count DESC`
  )
  return result.rows
}

export const getUserAuditTrail = async (userId, { page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit
  const result = await pool.query(
    `SELECT * FROM audit_logs 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  )
  return result.rows
}
