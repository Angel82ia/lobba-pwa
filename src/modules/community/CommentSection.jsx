import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { getPostComments, createComment, deleteComment } from '../../services/community'
import { Button, Alert } from '../../components/common'

const CommentSection = ({ postId, onUpdate }) => {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getPostComments(postId)
      setComments(data)
    } catch (err) {
      setError('Error al cargar comentarios')
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      setSubmitting(true)
      await createComment(postId, newComment)
      setNewComment('')
      fetchComments()
      if (onUpdate) onUpdate()
    } catch (err) {
      setError('Error al crear comentario')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId) => {
    if (window.confirm('¿Eliminar comentario?')) {
      try {
        await deleteComment(commentId)
        fetchComments()
        if (onUpdate) onUpdate()
      } catch (err) {
        setError('Error al eliminar comentario')
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Escribe un comentario..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={submitting}
          className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF1493] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        />
        <Button 
          type="submit" 
          disabled={!newComment.trim() || submitting}
          size="small"
          className="rounded-full"
        >
          {submitting ? '⏳' : '💬'}
        </Button>
      </form>

      {error && <Alert variant="error" className="text-sm">{error}</Alert>}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando comentarios...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay comentarios aún. ¡Sé el primero!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <div 
              key={comment.id} 
              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <strong className="text-sm font-semibold text-gray-900 dark:text-white">
                    {comment.first_name} {comment.last_name}
                  </strong>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {new Date(comment.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                {comment.can_delete && (
                  <button 
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-sm font-bold"
                    onClick={() => handleDelete(comment.id)}
                    aria-label="Eliminar comentario"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

CommentSection.propTypes = {
  postId: PropTypes.string.isRequired,
  onUpdate: PropTypes.func
}

export default CommentSection
