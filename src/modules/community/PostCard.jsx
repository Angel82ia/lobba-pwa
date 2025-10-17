import { useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { likePost, unlikePost, deletePost } from '../../services/community'
import { Card } from '../../components/common'
import CommentSection from './CommentSection'

const PostCard = ({ post, onUpdate }) => {
  const [showComments, setShowComments] = useState(false)
  const [liked, setLiked] = useState(post.user_has_liked)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const navigate = useNavigate()

  const handleLike = async () => {
    try {
      if (liked) {
        await unlikePost(post.id)
        setLiked(false)
        setLikesCount(prev => prev - 1)
      } else {
        await likePost(post.id)
        setLiked(true)
        setLikesCount(prev => prev + 1)
      }
    } catch {
      setLiked(prev => !prev)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('¿Seguro que quieres eliminar este post?')) {
      try {
        await deletePost(post.id)
        if (onUpdate) onUpdate()
      } catch {
        return
      }
    }
  }

  const handleUserClick = () => {
    navigate(`/comunidad/perfil/${post.user_id}`)
  }

  return (
    <Card padding="medium" className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" 
          onClick={handleUserClick}
        >
          {post.avatar ? (
            <img 
              src={post.avatar} 
              alt={post.first_name} 
              className="w-12 h-12 rounded-full object-cover border-2 border-[#FF1493]"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#FF1493] flex items-center justify-center text-white font-bold text-lg">
              {post.first_name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {post.first_name} {post.last_name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(post.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
        {post.can_delete && (
          <button 
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950 transition-all" 
            onClick={handleDelete}
            aria-label="Eliminar post"
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words leading-relaxed">
          {post.content}
        </p>
        {post.image_url && (
          <img 
            src={post.image_url} 
            alt="Post" 
            className="w-full mt-4 rounded-lg object-cover max-h-[500px]"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
            liked 
              ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={handleLike}
        >
          <span className="text-lg">{liked ? '❤️' : '🤍'}</span>
          <span>{likesCount}</span>
        </button>
        <button 
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
            showComments
              ? 'bg-[#FFE6F5] text-[#C71585] dark:bg-[#4A1135] dark:text-[#FF1493]'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => setShowComments(!showComments)}
        >
          <span className="text-lg">💬</span>
          <span>{post.comments_count}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <CommentSection postId={post.id} onUpdate={onUpdate} />
        </div>
      )}
    </Card>
  )
}

PostCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    user_id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    image_url: PropTypes.string,
    first_name: PropTypes.string.isRequired,
    last_name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    likes_count: PropTypes.number.isRequired,
    comments_count: PropTypes.number.isRequired,
    user_has_liked: PropTypes.bool.isRequired,
    can_delete: PropTypes.bool,
    created_at: PropTypes.string.isRequired
  }).isRequired,
  onUpdate: PropTypes.func
}

export default PostCard
