import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { getPostComments, createComment, deleteComment } from '../../services/community'
import './CommentSection.css'

const CommentSection = ({ postId, onUpdate }) => {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
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
      await createComment(postId, newComment)
      setNewComment('')
      fetchComments()
      if (onUpdate) onUpdate()
    } catch (err) {
      setError('Error al crear comentario')
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
    <div className="comment-section">
      <form onSubmit={handleSubmit} className="comment-form">
        <input
          type="text"
          placeholder="Escribe un comentario..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button type="submit" disabled={!newComment.trim()}>
          Enviar
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Cargando comentarios...</div>
      ) : (
        <div className="comments-list">
          {comments.map(comment => (
            <div key={comment.id} className="comment">
              <div className="comment-header">
                <strong>{comment.first_name} {comment.last_name}</strong>
                <span className="comment-time">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p>{comment.content}</p>
              {comment.can_delete && (
                <button 
                  className="delete-comment-btn"
                  onClick={() => handleDelete(comment.id)}
                >
                  Eliminar
                </button>
              )}
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
