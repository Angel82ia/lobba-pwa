import pool from '../config/database.js'

export const createComment = async ({ postId, userId, content }) => {
  const result = await pool.query(
    `INSERT INTO post_comments (post_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [postId, userId, content]
  )
  return result.rows[0]
}

export const findCommentsByPostId = async (postId, { page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit
  
  const result = await pool.query(
    `SELECT c.*,
            u.first_name, u.last_name, u.avatar
     FROM post_comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC
     LIMIT $2 OFFSET $3`,
    [postId, limit, offset]
  )
  return result.rows
}

export const findCommentById = async (id) => {
  const result = await pool.query(
    `SELECT c.*,
            u.first_name, u.last_name, u.avatar
     FROM post_comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.id = $1`,
    [id]
  )
  return result.rows[0]
}

export const deleteComment = async (id) => {
  const result = await pool.query(
    'DELETE FROM post_comments WHERE id = $1 RETURNING *',
    [id]
  )
  return result.rows[0]
}
