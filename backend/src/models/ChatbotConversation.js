import pool from '../config/database.js'

export const findOrCreateConversation = async (userId) => {
  let conversation = await pool.query(
    'SELECT * FROM chatbot_conversations WHERE user_id = $1',
    [userId]
  )
  
  if (conversation.rows.length === 0) {
    conversation = await pool.query(
      'INSERT INTO chatbot_conversations (user_id) VALUES ($1) RETURNING *',
      [userId]
    )
  }
  
  return conversation.rows[0]
}

export const findConversationById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM chatbot_conversations WHERE id = $1',
    [id]
  )
  return result.rows[0]
}

export const updateLastMessageTime = async (conversationId) => {
  const result = await pool.query(
    `UPDATE chatbot_conversations 
     SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 RETURNING *`,
    [conversationId]
  )
  return result.rows[0]
}

export const findUserConversations = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM chatbot_conversations 
     WHERE user_id = $1 
     ORDER BY last_message_at DESC`,
    [userId]
  )
  return result.rows
}
