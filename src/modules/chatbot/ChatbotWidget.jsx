import { useState, useEffect, useRef } from 'react'
import { sendMessage, getConversation, clearConversation } from '../../services/chatbot'
import { Button } from '../../components/common'

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
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating button */}
      {!isOpen && (
        <button 
          className="group relative flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#FF1493] to-[#C71585] text-white rounded-full shadow-2xl hover:shadow-[#FF1493]/50 hover:scale-105 active:scale-95 transition-all duration-300"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat con Olivia"
        >
          <span className="text-2xl animate-pulse">💬</span>
          <span className="font-semibold">Olivia</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="flex flex-col w-[380px] h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#FF1493] to-[#C71585] text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="text-3xl">🤖</span>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Olivia</h3>
                <span className="text-xs text-white/90">Asistente LOBBA</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button 
                  onClick={handleClear} 
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors" 
                  title="Limpiar conversación"
                  aria-label="Limpiar conversación"
                >
                  🗑️
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-xl font-bold"
                aria-label="Cerrar chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="text-6xl mb-4 animate-bounce">👋</div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  ¡Hola! Soy Olivia
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Tu asistente virtual de LOBBA. Puedo ayudarte a encontrar salones, reservar citas y responder tus preguntas.
                </p>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.sender_type === 'user'
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isUser 
                        ? 'bg-[#FF1493] text-white' 
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                    <span className={`text-xs block mt-1 ${
                      isUser ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              )
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-100 rounded-lg px-4 py-2 text-sm">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form 
            onSubmit={handleSend}
            className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF1493] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
            />
            <Button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="rounded-full px-4"
              size="small"
            >
              ➤
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}

export default ChatbotWidget
