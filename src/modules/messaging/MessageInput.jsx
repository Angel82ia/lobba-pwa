import { useState } from 'react'
import PropTypes from 'prop-types'
import { sendMessage } from '../../services/message'
import { Button } from '../../components/common'

const MessageInput = ({ onSendMessage }) => {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      setSending(true)
      const messageData = onSendMessage(content)
      await sendMessage(messageData.receiverId, messageData.content)
      setContent('')
    } finally {
      setSending(false)
    }
  }

  return (
    <form 
      className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" 
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe un mensaje..."
        disabled={sending}
        className="flex-1 px-4 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF1493] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      />
      <Button 
        type="submit" 
        disabled={sending || !content.trim()}
        className="rounded-full"
      >
        {sending ? 'Enviando...' : '📤'}
      </Button>
    </form>
  )
}

MessageInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
}

export default MessageInput
