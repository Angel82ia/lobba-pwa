import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getMessages } from '../../services/message'
import { connectSocket, joinConversation, onMessageReceived } from '../../services/socket'
import useStore from '../../store'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { Card, Alert } from '../../components/common'

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
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="text-center" padding="large">
          <p className="text-gray-600 dark:text-gray-400">
            Selecciona una conversación para comenzar
          </p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando mensajes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Alert variant="error">{error}</Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card className="flex flex-col h-[calc(100vh-12rem)]" padding="none">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="font-primary text-xl font-bold text-gray-900 dark:text-white">
            Mensajes
          </h2>
        </div>
        
        {/* Messages */}
        <MessageList messages={messages} currentUserId={auth.user.id} />
        <div ref={messagesEndRef} />
        
        {/* Input */}
        <MessageInput onSendMessage={handleSendMessage} />
      </Card>
    </div>
  )
}

export default ChatWindow
