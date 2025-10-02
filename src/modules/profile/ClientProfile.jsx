import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getClientProfile } from '../../services/profile'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import useStore from '../../store'
import './ClientProfile.css'

const ClientProfile = () => {
  const { id } = useParams()
  const { auth } = useStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isOwnProfile = !id || id === auth.user?.id

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = await getClientProfile(id)
        setProfile(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (auth.isAuthenticated) {
      fetchProfile()
    }
  }, [id, auth.isAuthenticated])

  if (loading) return <div className="loading">Cargando perfil...</div>
  if (error) return <div className="error">Error: {error}</div>
  if (!profile) return <div className="not-found">Perfil no encontrado</div>

  return (
    <div className="client-profile">
      <Card>
        <div className="profile-header">
          {profile.avatar && (
            <img 
              src={profile.avatar} 
              alt={`${profile.firstName} ${profile.lastName}`}
              className="profile-avatar"
            />
          )}
          <div className="profile-info">
            <h1>{profile.firstName} {profile.lastName}</h1>
            <p className="profile-email">{profile.email}</p>
            {profile.membershipActive && (
              <span className="membership-badge">Socia Activa</span>
            )}
          </div>
        </div>

        {profile.bio && (
          <div className="profile-bio">
            <h3>Sobre mí</h3>
            <p>{profile.bio}</p>
          </div>
        )}

        {isOwnProfile && (
          <div className="profile-actions">
            <Link to="/profile/edit">
              <Button>Editar Perfil</Button>
            </Link>
          </div>
        )}

        <div className="profile-stats">
          <p>Miembro desde: {new Date(profile.createdAt).toLocaleDateString('es-ES')}</p>
        </div>
      </Card>
    </div>
  )
}

export default ClientProfile
