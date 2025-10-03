import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { getUserProfile, followUser, unfollowUser } from '../../services/community'
import PostCard from './PostCard'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import './UserProfile.css'

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

  if (loading) return <div className="loading">Cargando perfil...</div>
  if (error) return <div className="error-message">{error}</div>
  if (!profile) return <div>Perfil no encontrado</div>

  return (
    <div className="user-profile-page">
      <Card>
        <div className="profile-header">
          {profile.user.avatar && (
            <img src={profile.user.avatar} alt={profile.user.first_name} className="profile-avatar" />
          )}
          <div className="profile-info">
            <h1>{profile.user.first_name} {profile.user.last_name}</h1>
            {profile.user.bio && <p className="bio">{profile.user.bio}</p>}
            
            <div className="profile-stats">
              <div className="stat">
                <strong>{profile.stats.posts}</strong>
                <span>Posts</span>
              </div>
              <div className="stat">
                <strong>{profile.stats.followers}</strong>
                <span>Seguidores</span>
              </div>
              <div className="stat">
                <strong>{profile.stats.following}</strong>
                <span>Siguiendo</span>
              </div>
            </div>

            <Button onClick={handleFollow}>
              {following ? 'Dejar de seguir' : 'Seguir'}
            </Button>
          </div>
        </div>

        <div className="profile-posts">
          <h2>Posts de {profile.user.first_name}</h2>
          {profile.recentPosts.length === 0 ? (
            <p className="empty-state">No hay posts aún</p>
          ) : (
            profile.recentPosts.map(post => (
              <PostCard key={post.id} post={post} onUpdate={fetchProfile} />
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

export default UserProfile
