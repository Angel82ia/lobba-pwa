import pool from '../config/database.js'

export const followUser = async ({ followerId, followingId }) => {
  if (followerId === followingId) {
    throw new Error('Cannot follow yourself')
  }

  try {
    const result = await pool.query(
      `INSERT INTO user_follows (follower_id, following_id)
       VALUES ($1, $2)
       RETURNING *`,
      [followerId, followingId]
    )
    return result.rows[0]
  } catch (error) {
    if (error.code === '23505') {
      return null
    }
    throw error
  }
}

export const unfollowUser = async ({ followerId, followingId }) => {
  const result = await pool.query(
    'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2 RETURNING *',
    [followerId, followingId]
  )
  return result.rows[0]
}

export const findFollowers = async (userId, { page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit
  
  const result = await pool.query(
    `SELECT u.id, u.first_name, u.last_name, u.avatar, u.bio,
            uf.created_at as followed_at
     FROM user_follows uf
     JOIN users u ON uf.follower_id = u.id
     WHERE uf.following_id = $1
     ORDER BY uf.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  )
  return result.rows
}

export const findFollowing = async (userId, { page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit
  
  const result = await pool.query(
    `SELECT u.id, u.first_name, u.last_name, u.avatar, u.bio,
            uf.created_at as followed_at
     FROM user_follows uf
     JOIN users u ON uf.following_id = u.id
     WHERE uf.follower_id = $1
     ORDER BY uf.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  )
  return result.rows
}

export const isFollowing = async (followerId, followingId) => {
  const result = await pool.query(
    'SELECT EXISTS(SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2) as following',
    [followerId, followingId]
  )
  return result.rows[0].following
}

export const getFollowerCount = async (userId) => {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM user_follows WHERE following_id = $1',
    [userId]
  )
  return parseInt(result.rows[0].count)
}

export const getFollowingCount = async (userId) => {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM user_follows WHERE follower_id = $1',
    [userId]
  )
  return parseInt(result.rows[0].count)
}
