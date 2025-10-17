import { useState } from 'react'
import PropTypes from 'prop-types'
import { createPost } from '../../services/community'
import { Button, Textarea, Input, Alert } from '../../components/common'

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
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="¿Qué estás pensando?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          disabled={loading}
          maxLength={1000}
          fullWidth
        />
        
        <Input
          type="url"
          placeholder="URL de imagen (opcional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={loading}
          fullWidth
        />

        {imageUrl && (
          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-full h-auto max-h-64 object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                setError('URL de imagen inválida')
              }}
            />
          </div>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={loading || !content.trim()}
          >
            {loading ? 'Publicando...' : 'Publicar'}
          </Button>
        </div>
      </form>
    </div>
  )
}

PostComposer.propTypes = {
  onPostCreated: PropTypes.func
}

export default PostComposer
