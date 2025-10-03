import { useState } from 'react'
import PropTypes from 'prop-types'
import { createPost } from '../../services/community'
import Button from '../../components/common/Button'
import './PostComposer.css'

const PostComposer = ({ onPostCreated }) => {
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim()) {
      setError('El contenido es requerido')
      return
    }

    try {
      setLoading(true)
      setError('')
      await createPost({ content, imageUrl: imageUrl || null })
      setContent('')
      setImageUrl('')
      if (onPostCreated) {
        onPostCreated()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="post-composer">
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="¿Qué estás pensando?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="4"
          disabled={loading}
        />
        
        <input
          type="url"
          placeholder="URL de imagen (opcional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={loading}
        />

        {imageUrl && (
          <div className="image-preview">
            <img src={imageUrl} alt="Preview" />
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <Button type="submit" disabled={loading || !content.trim()}>
          {loading ? 'Publicando...' : 'Publicar'}
        </Button>
      </form>
    </div>
  )
}

PostComposer.propTypes = {
  onPostCreated: PropTypes.func
}

export default PostComposer
