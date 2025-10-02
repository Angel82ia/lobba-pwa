import pool from '../config/database.js'
import crypto from 'crypto'

export const createMessage = async ({
  conversationId,
  senderId,
  receiverId,
  content,
  messageType = 'text',
  attachmentUrl = null,
  reservationId = null,
}) => {
  let finalConversationId = conversationId
  if (!finalConversationId) {
    const ids = [senderId, receiverId].sort()
    finalConversationId = crypto.createHash('sha256').update(ids.join(':')).digest('hex')
  }
  
  const result = await pool.query(
    `INSERT INTO messages 
     (conversation_id, sender_id, receiver_id, content, message_type, attachment_url, reservation_id, is_read)
     VALUES ($1, $2, $3, $4, $5, $6, $7, false)
     RETURNING *`,
    [finalConversationId, senderId, receiverId, content, messageType, attachmentUrl, reservationId]
  )
  return result.rows[0]
}

export const findMessageById = async (id) => {
  const result = await pool.query('SELECT * FROM messages WHERE id = $1', [id])
  return result.rows[0] || null
}

export const findMessagesByConversation = async (conversationId, options = {}) => {
  const limit = options.limit || 50
  const offset = options.offset || 0

  const result = await pool.query(
    `SELECT m.*, 
            sender.first_name as sender_first_name, 
            sender.last_name as sender_last_name,
            receiver.first_name as receiver_first_name, 
            receiver.last_name as receiver_last_name
     FROM messages m
     LEFT JOIN users sender ON m.sender_id = sender.id
     LEFT JOIN users receiver ON m.receiver_id = receiver.id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at DESC
     LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset]
  )
  return result.rows
}

export const markAsRead = async (messageId) => {
  const result = await pool.query(
    'UPDATE messages SET is_read = true WHERE id = $1 RETURNING *',
    [messageId]
  )
  return result.rows[0]
}

export const getUnreadCount = async (userId) => {
  const result = await pool.query(
    'SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = false',
    [userId]
  )
  return parseInt(result.rows[0].count, 10)
}

export const findConversations = async (userId) => {
  const result = await pool.query(
    `SELECT DISTINCT conversation_id,
            MAX(created_at) as last_message_at,
            (SELECT COUNT(*) FROM messages 
             WHERE conversation_id = m.conversation_id 
               AND receiver_id = $1 
               AND is_read = false) as unread_count
     FROM messages m
     WHERE sender_id = $1 OR receiver_id = $1
     GROUP BY conversation_id
     ORDER BY last_message_at DESC`,
    [userId]
  )
  return result.rows
}
