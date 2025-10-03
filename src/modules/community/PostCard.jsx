import { useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { likePost, unlikePost, deletePost } from '../../services/community'
import CommentSection from './CommentSection'
import './PostCard.css'

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
    <div className="post-card">
      <div className="post-header">
        <div className="post-author" onClick={handleUserClick}>
          {post.avatar && <img src={post.avatar} alt={post.first_name} />}
          <div className="author-info">
            <span className="author-name">{post.first_name} {post.last_name}</span>
            <span className="post-time">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        {post.can_delete && (
          <button className="delete-btn" onClick={handleDelete}>×</button>
        )}
      </div>

      <div className="post-content">
        <p>{post.content}</p>
        {post.image_url && (
          <img src={post.image_url} alt="Post" className="post-image" />
        )}
      </div>

      <div className="post-actions">
        <button 
          className={`action-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          {liked ? '❤️' : '🤍'} {likesCount}
        </button>
        <button 
          className="action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 {post.comments_count}
        </button>
      </div>

      {showComments && (
        <CommentSection postId={post.id} onUpdate={onUpdate} />
      )}
    </div>
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
