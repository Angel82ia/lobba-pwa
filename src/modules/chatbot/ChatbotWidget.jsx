import { useState, useEffect, useRef } from 'react'
import { sendMessage, getConversation, clearConversation } from '../../services/chatbot'
import Button from '../../components/common/Button'
import './ChatbotWidget.css'

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadConversation()
    }
  }, [isOpen, messages.length])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversation = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getConversation()
      setMessages(data.messages || [])
    } catch (err) {
      setError('Error al cargar la conversación')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setError('')

    const tempUserMsg = {
      id: Date.now(),
      sender_type: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMsg])

    try {
      setLoading(true)
      const data = await sendMessage(userMessage)
      
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMsg.id)
        return [...filtered, data.userMessage, data.botMessage]
      })
    } catch (err) {
      setError('Error al enviar mensaje')
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id))
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    if (window.confirm('¿Borrar toda la conversación?')) {
      try {
        await clearConversation()
        setMessages([])
      } catch (err) {
        setError('Error al limpiar conversación')
      }
    }
  }

  return (
    <div className="chatbot-widget">
      {!isOpen && (
        <button 
          className="chatbot-button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat con Olivia"
        >
          <span className="chatbot-icon">💬</span>
          <span className="chatbot-badge">Olivia</span>
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <span className="chatbot-avatar">🤖</span>
              <div>
                <h3>Olivia</h3>
                <span className="chatbot-status">Asistente LOBBA</span>
              </div>
            </div>
            <div className="chatbot-header-actions">
              {messages.length > 0 && (
                <button onClick={handleClear} className="chatbot-clear-btn" title="Limpiar conversación">
                  🗑️
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="chatbot-close-btn">
                ✕
              </button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.length === 0 && !loading && (
              <div className="chatbot-welcome">
                <p>👋 ¡Hola! Soy Olivia, tu asistente virtual de LOBBA.</p>
                <p>¿En qué puedo ayudarte hoy?</p>
              </div>
            )}

            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`chatbot-message ${msg.sender_type === 'user' ? 'user' : 'bot'}`}
              >
                <div className="message-content">{msg.content}</div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-message bot">
                <div className="message-content typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              Enviar
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}

export default ChatbotWidget
