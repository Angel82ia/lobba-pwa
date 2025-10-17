import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getClientProfile } from '../../services/profile'
import { Button, Card, Alert } from '../../components/common'
import useStore from '../../store'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando perfil...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Alert variant="error">Error: {error}</Alert>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Alert variant="info">Perfil no encontrado</Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card padding="large">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
          {profile.avatar && (
            <img 
              src={profile.avatar} 
              alt={`${profile.firstName} ${profile.lastName}`}
              className="w-32 h-32 rounded-full object-cover border-4 border-[#FF1493]"
            />
          )}
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-primary text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              {profile.email}
            </p>
            {profile.membershipActive && (
              <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF1493] to-[#C71585] text-white text-sm font-semibold">
                Socia Activa
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-primary text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Sobre mí
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Profile Actions */}
        {isOwnProfile && (
          <div className="mb-8">
            <Link to="/profile/edit">
              <Button>Editar Perfil</Button>
            </Link>
          </div>
        )}

        {/* Profile Stats */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>
            Miembro desde: {new Date(profile.createdAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </Card>
    </div>
  )
}

export default ClientProfile
