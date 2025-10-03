import pool from '../config/database.js'

export const createMessage = async ({ conversationId, senderType, content }) => {
  const result = await pool.query(
    `INSERT INTO chatbot_messages (conversation_id, sender_type, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [conversationId, senderType, content]
  )
  return result.rows[0]
}

export const findMessagesByConversation = async (conversationId, { limit = 50, offset = 0 } = {}) => {
  const result = await pool.query(
    `SELECT * FROM chatbot_messages 
     WHERE conversation_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset]
  )
  return result.rows.reverse()
}

export const findRecentMessages = async (conversationId, limit = 10) => {
  const result = await pool.query(
    `SELECT * FROM chatbot_messages 
     WHERE conversation_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [conversationId, limit]
  )
  return result.rows.reverse()
}

export const deleteConversationMessages = async (conversationId) => {
  const result = await pool.query(
    'DELETE FROM chatbot_messages WHERE conversation_id = $1 RETURNING *',
    [conversationId]
  )
  return result.rows
}
