import { useState, useEffect, useCallback } from 'react'
import { getFeed, getAllPosts } from '../../services/community'
import PostCard from './PostCard'
import PostComposer from './PostComposer'
import Card from '../../components/common/Card'
import './CommunityFeed.css'

const CommunityFeed = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = filter === 'following' 
        ? await getFeed(page, 20)
        : await getAllPosts(page, 20)
      
      if (page === 1) {
        setPosts(data)
      } else {
        setPosts(prev => [...prev, ...data])
      }
      
      setHasMore(data.length === 20)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar posts')
    } finally {
      setLoading(false)
    }
  }, [filter, page])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    setPage(1)
    setPosts([])
  }

  const handlePostCreated = () => {
    setPage(1)
    setPosts([])
    fetchPosts()
  }

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
  }

  return (
    <div className="community-feed">
      <Card>
        <h1>Comunidad LOBBA</h1>
        
        <div className="feed-filters">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => handleFilterChange('all')}
          >
            Todos
          </button>
          <button
            className={filter === 'following' ? 'active' : ''}
            onClick={() => handleFilterChange('following')}
          >
            Siguiendo
          </button>
        </div>

        <PostComposer onPostCreated={handlePostCreated} />

        {error && <div className="error-message">{error}</div>}

        <div className="posts-list">
          {posts.map(post => (
            <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
          ))}
        </div>

        {loading && <div className="loading">Cargando posts...</div>}

        {!loading && posts.length === 0 && (
          <div className="empty-state">
            <p>No hay posts para mostrar</p>
          </div>
        )}

        {!loading && hasMore && posts.length > 0 && (
          <button className="load-more" onClick={handleLoadMore}>
            Cargar más
          </button>
        )}
      </Card>
    </div>
  )
}

export default CommunityFeed
