import { useState, useEffect, useCallback } from 'react'
import { getFeed, getAllPosts } from '../../services/community'
import PostCard from './PostCard'
import PostComposer from './PostComposer'
import { Card, Alert, Button } from '../../components/common'

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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card padding="large" className="mb-8">
        <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-6">
          Comunidad LOBBA
        </h1>
        
        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <button
            className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
              filter === 'all'
                ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => handleFilterChange('all')}
          >
            Todos
          </button>
          <button
            className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
              filter === 'following'
                ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => handleFilterChange('following')}
          >
            Siguiendo
          </button>
        </div>

        {/* Post Composer */}
        <PostComposer onPostCreated={handlePostCreated} />
      </Card>

      {/* Error */}
      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {/* Posts */}
      <div className="space-y-6">
        {posts.map(post => (
          <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando posts...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <Card className="text-center" padding="large">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No hay posts para mostrar
          </p>
        </Card>
      )}

      {/* Load More */}
      {!loading && hasMore && posts.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline" onClick={handleLoadMore}>
            Cargar más
          </Button>
        </div>
      )}
    </div>
  )
}

export default CommunityFeed
