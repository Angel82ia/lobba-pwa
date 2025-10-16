import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { getMessages } from '../../services/message'
import { connectSocket, joinConversation, onMessageReceived } from '../../services/socket'
import useStore from '../../store'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import Card from '../../components/common/Card'
import './ChatWindow.css'

const ChatWindow = () => {
  const { conversationId } = useParams()
  const { auth } = useStore()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!conversationId) return

    let isMounted = true
    
    const loadMessages = async () => {
      try {
        setLoading(true)
        const data = await getMessages(conversationId)
        if (isMounted) {
          setMessages(data.reverse())
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadMessages()

    const token = localStorage.getItem('token')
    let cleanup = null
    
    if (token) {
      connectSocket(token)
      joinConversation(conversationId)

      const handleNewMessage = (newMessage) => {
        if (isMounted) {
          setMessages((prev) => [newMessage, ...prev])
        }
      }

      cleanup = onMessageReceived(handleNewMessage)
    }

    return () => {
      isMounted = false
      if (cleanup) cleanup()
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = (content) => {
    const [userId1, userId2] = conversationId.split(':')
    const receiverId = userId1 === auth.user.id ? userId2 : userId1
    return { conversationId, receiverId, content }
  }

  if (!conversationId) {
    return (
      <div className="chat-window">
        <Card>
          <p>Selecciona una conversación para comenzar</p>
        </Card>
      </div>
    )
  }

  if (loading) return <div className="loading">Cargando mensajes...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="chat-window">
      <Card className="chat-card">
        <div className="chat-header">
          <h2>Mensajes</h2>
        </div>
        
        <MessageList messages={messages} currentUserId={auth.user.id} />
        <div ref={messagesEndRef} />
        
        <MessageInput onSendMessage={handleSendMessage} />
      </Card>
    </div>
  )
}

export default ChatWindow
