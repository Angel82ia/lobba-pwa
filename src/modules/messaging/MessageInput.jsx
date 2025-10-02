import { useState } from 'react'
import PropTypes from 'prop-types'
import { sendMessage } from '../../services/message'
import Button from '../../components/common/Button'
import './MessageInput.css'

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
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe un mensaje..."
        disabled={sending}
      />
      <Button type="submit" disabled={sending || !content.trim()}>
        {sending ? 'Enviando...' : 'Enviar'}
      </Button>
    </form>
  )
}

MessageInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
}

export default MessageInput
