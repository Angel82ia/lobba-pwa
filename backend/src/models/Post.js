import pool from '../config/database.js'

export const createPost = async ({ userId, content, imageUrl }) => {
  const result = await pool.query(
    `INSERT INTO community_posts (user_id, content, image_url)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, content, imageUrl]
  )
  return result.rows[0]
}

export const findAllPosts = async ({ page = 1, limit = 20, userId = null } = {}) => {
  const offset = (page - 1) * limit
  
  let query = `
    SELECT p.*,
           u.first_name, u.last_name, u.avatar,
           EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as user_has_liked
    FROM community_posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.is_public = true
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3
  `
  
  const result = await pool.query(query, [userId, limit, offset])
  return result.rows
}

export const findPostById = async (id, userId = null) => {
  const result = await pool.query(
    `SELECT p.*,
            u.first_name, u.last_name, u.avatar,
            EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as user_has_liked
     FROM community_posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = $2`,
    [userId, id]
  )
  return result.rows[0]
}

export const findPostsByUserId = async (userId, { page = 1, limit = 20, viewerId = null } = {}) => {
  const offset = (page - 1) * limit
  
  const result = await pool.query(
    `SELECT p.*,
            u.first_name, u.last_name, u.avatar,
            EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as user_has_liked
     FROM community_posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.user_id = $2 AND p.is_public = true
     ORDER BY p.created_at DESC
     LIMIT $3 OFFSET $4`,
    [viewerId, userId, limit, offset]
  )
  return result.rows
}

export const findFeedPosts = async (userId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit
  
  const result = await pool.query(
    `SELECT p.*,
            u.first_name, u.last_name, u.avatar,
            EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as user_has_liked
     FROM community_posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.is_public = true
       AND (p.user_id = $1 OR p.user_id IN (
         SELECT following_id FROM user_follows WHERE follower_id = $1
       ))
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  )
  return result.rows
}

export const updatePost = async (id, updates) => {
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
    return await findPostById(id)
  }

  values.push(id)

  const result = await pool.query(
    `UPDATE community_posts 
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )
  return result.rows[0]
}

export const deletePost = async (id) => {
  const result = await pool.query(
    'DELETE FROM community_posts WHERE id = $1 RETURNING *',
    [id]
  )
  return result.rows[0]
}

export const incrementLikes = async (id) => {
  const result = await pool.query(
    `UPDATE community_posts 
     SET likes_count = likes_count + 1 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export const decrementLikes = async (id) => {
  const result = await pool.query(
    `UPDATE community_posts 
     SET likes_count = GREATEST(0, likes_count - 1) 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export const incrementComments = async (id) => {
  const result = await pool.query(
    `UPDATE community_posts 
     SET comments_count = comments_count + 1 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export const decrementComments = async (id) => {
  const result = await pool.query(
    `UPDATE community_posts 
     SET comments_count = GREATEST(0, comments_count - 1) 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}
