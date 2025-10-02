import PropTypes from 'prop-types'
import './MessageList.css'

const MessageList = ({ messages, currentUserId }) => {
  if (messages.length === 0) {
    return (
      <div className="message-list empty">
        <p>No hay mensajes aún. ¡Envía el primero!</p>
      </div>
    )
  }

  return (
    <div className="message-list">
      {messages.map((message) => {
        const isSent = message.sender_id === currentUserId
        const timestamp = new Date(message.created_at).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })

        return (
          <div key={message.id} className={`message ${isSent ? 'sent' : 'received'}`}>
            <div className="message-content">
              <p>{message.content}</p>
              <span className="message-time">{timestamp}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      sender_id: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      created_at: PropTypes.string.isRequired,
    })
  ).isRequired,
  currentUserId: PropTypes.string.isRequired,
}

export default MessageList
