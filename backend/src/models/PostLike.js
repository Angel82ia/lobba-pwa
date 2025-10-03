import pool from '../config/database.js'

export const likePost = async ({ postId, userId }) => {
  try {
    const result = await pool.query(
      `INSERT INTO post_likes (post_id, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [postId, userId]
    )
    return result.rows[0]
  } catch (error) {
    if (error.code === '23505') {
      return null
    }
    throw error
  }
}

export const unlikePost = async ({ postId, userId }) => {
  const result = await pool.query(
    'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2 RETURNING *',
    [postId, userId]
  )
  return result.rows[0]
}

export const findLikesByPostId = async (postId, { page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit
  
  const result = await pool.query(
    `SELECT pl.*,
            u.first_name, u.last_name, u.avatar
     FROM post_likes pl
     JOIN users u ON pl.user_id = u.id
     WHERE pl.post_id = $1
     ORDER BY pl.created_at DESC
     LIMIT $2 OFFSET $3`,
    [postId, limit, offset]
  )
  return result.rows
}

export const hasUserLikedPost = async (postId, userId) => {
  const result = await pool.query(
    'SELECT EXISTS(SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2) as liked',
    [postId, userId]
  )
  return result.rows[0].liked
}
