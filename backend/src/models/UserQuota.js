import pool from '../config/database.js'

export const findQuotaByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM user_quotas WHERE user_id = $1',
    [userId]
  )
  return result.rows[0]
}

export const getOrCreateQuota = async (userId) => {
  let quota = await findQuotaByUserId(userId)
  if (!quota) {
    quota = await createQuota(userId)
  }
  return quota
}

export const createQuota = async (userId) => {
  const result = await pool.query(
    `INSERT INTO user_quotas (user_id, nails_quota_used, nails_quota_limit, hairstyle_quota_used, hairstyle_quota_limit)
     VALUES ($1, 0, 100, 0, 4)
     RETURNING *`,
    [userId]
  )
  return result.rows[0]
}

export const incrementNailsQuota = async (userId) => {
  const result = await pool.query(
    `UPDATE user_quotas 
     SET nails_quota_used = nails_quota_used + 1, updated_at = CURRENT_TIMESTAMP 
     WHERE user_id = $1 
     RETURNING *`,
    [userId]
  )
  return result.rows[0]
}

export const incrementHairstyleQuota = async (userId) => {
  const result = await pool.query(
    `UPDATE user_quotas 
     SET hairstyle_quota_used = hairstyle_quota_used + 1, updated_at = CURRENT_TIMESTAMP 
     WHERE user_id = $1 
     RETURNING *`,
    [userId]
  )
  return result.rows[0]
}

export const checkNailsQuota = async (userId) => {
  const quota = await getOrCreateQuota(userId)
  return {
    hasQuota: quota.nails_quota_used < quota.nails_quota_limit,
    used: quota.nails_quota_used,
    limit: quota.nails_quota_limit,
    remaining: quota.nails_quota_limit - quota.nails_quota_used,
  }
}

export const checkHairstyleQuota = async (userId) => {
  const quota = await getOrCreateQuota(userId)
  return {
    hasQuota: quota.hairstyle_quota_used < quota.hairstyle_quota_limit,
    used: quota.hairstyle_quota_used,
    limit: quota.hairstyle_quota_limit,
    remaining: quota.hairstyle_quota_limit - quota.hairstyle_quota_used,
  }
}

export const resetMonthlyQuotas = async () => {
  await pool.query('SELECT reset_monthly_quotas()')
}
