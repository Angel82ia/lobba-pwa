import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { getUserProfile, followUser, unfollowUser } from '../../services/community'
import PostCard from './PostCard'
import { Card, Button, Alert } from '../../components/common'

const UserProfile = () => {
  const { userId } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [following, setFollowing] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getUserProfile(userId)
      setProfile(data)
      setFollowing(data.isFollowing)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar perfil')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleFollow = async () => {
    try {
      if (following) {
        await unfollowUser(userId)
        setFollowing(false)
      } else {
        await followUser(userId)
        setFollowing(true)
      }
      fetchProfile()
    } catch (err) {
      setError('Error al seguir usuario')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando perfil...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Alert variant="error">{error}</Alert>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="text-center" padding="large">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Perfil no encontrado
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Profile Header */}
      <Card padding="large" className="mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          {profile.user.avatar ? (
            <img 
              src={profile.user.avatar} 
              alt={profile.user.first_name}
              className="w-32 h-32 rounded-full object-cover border-4 border-[#FF1493] shadow-lg flex-shrink-0"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-[#FF1493] flex items-center justify-center text-white font-bold text-5xl flex-shrink-0">
              {profile.user.first_name?.[0]?.toUpperCase()}
            </div>
          )}
          
          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {profile.user.first_name} {profile.user.last_name}
            </h1>
            {profile.user.bio && (
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                {profile.user.bio}
              </p>
            )}
            
            {/* Stats */}
            <div className="flex justify-center md:justify-start gap-8 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#FF1493]">
                  {profile.stats.posts}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Posts
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#FF1493]">
                  {profile.stats.followers}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Seguidores
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#FF1493]">
                  {profile.stats.following}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Siguiendo
                </div>
              </div>
            </div>

            {/* Follow Button */}
            <Button 
              onClick={handleFollow}
              variant={following ? 'outline' : 'primary'}
            >
              {following ? '✓ Siguiendo' : '+ Seguir'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Posts Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Posts de {profile.user.first_name}
        </h2>
        {profile.recentPosts.length === 0 ? (
          <Card className="text-center" padding="large">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-600 dark:text-gray-400">
              No hay posts aún
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {profile.recentPosts.map(post => (
              <PostCard key={post.id} post={post} onUpdate={fetchProfile} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile
