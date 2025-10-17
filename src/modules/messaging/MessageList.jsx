import PropTypes from 'prop-types'

const MessageList = ({ messages, currentUserId }) => {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          No hay mensajes aún. ¡Envía el primero!
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
      {messages.map((message) => {
        const isSent = message.sender_id === currentUserId
        const timestamp = new Date(message.created_at).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })

        return (
          <div 
            key={message.id} 
            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                isSent 
                  ? 'bg-[#FF1493] text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
              }`}
            >
              <p className="text-sm break-words">{message.content}</p>
              <span className={`text-xs block mt-1 ${
                isSent ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {timestamp}
              </span>
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
