import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Alert } from '../components/common'
import SharedMembershipCard from '../modules/membership/components/SharedMembershipCard'
import { getActiveMembership, getSharedMembership, revokeSharedMembership } from '../services/membership'

const Membership = () => {
  const navigate = useNavigate()
  const [membership, setMembership] = useState(null)
  const [sharedMembership, setSharedMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMembershipData()
  }, [])

  const fetchMembershipData = async () => {
    try {
      setLoading(true)
      setError(null)

      const membershipData = await getActiveMembership()
      setMembership(membershipData)

      if (membershipData && membershipData.plan_type === 'spirit') {
        try {
          const sharedData = await getSharedMembership(membershipData.id)
          setSharedMembership(sharedData)
        } catch (err) {
          if (err.response?.status !== 404) {
            // Error fetching shared membership
          }
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No tienes una membresía activa')
      } else {
        setError('Error al cargar tu membresía')
      }
      // Error loading membership
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (sharedMembershipId) => {
    try {
      setActionLoading(true)
      await revokeSharedMembership(sharedMembershipId)
      setSharedMembership(null)
      alert('La compartición de membresía ha sido revocada exitosamente')
    } catch (err) {
      alert('Error al revocar la compartición. Por favor, inténtalo de nuevo.')
      // Error revoking shared membership
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = () => {
    navigate('/membership/edit')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMembershipTypeLabel = (planType) => {
    return planType === 'spirit' ? 'Spirit' : 'Essential'
  }

  const getMembershipStatusLabel = (status) => {
    const labels = {
      active: 'Activa',
      suspended: 'Suspendida',
      expired: 'Expirada',
      cancelled: 'Cancelada'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando tu membresía...</p>
        </div>
      </div>
    )
  }

  if (error && !membership) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Alert variant="error" className="mb-6">{error}</Alert>
        <Card className="text-center" padding="large">
          <h2 className="font-primary text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No tienes una membresía activa
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Únete a LOBBA y disfruta de beneficios exclusivos
          </p>
          <Button onClick={() => navigate('/membership/plans')}>
            Ver Planes
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-8">
        Mi Membresía
      </h1>

      {/* Membership Card */}
      <Card className="mb-8" padding="large">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <div className="mb-4">
              <span 
                className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
                  membership.plan_type === 'spirit'
                    ? 'bg-gradient-to-r from-[#FF1493] to-[#C71585] text-white'
                    : 'bg-gradient-to-r from-blue-500 to-blue-700 text-white'
                }`}
              >
                {getMembershipTypeLabel(membership.plan_type)}
              </span>
            </div>

            <h2 className="font-primary text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Membresía {getMembershipTypeLabel(membership.plan_type)}
            </h2>

            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p>
                <strong className="text-gray-900 dark:text-white">Estado:</strong>{' '}
                <span className={`font-semibold ${
                  membership.status === 'active' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {getMembershipStatusLabel(membership.status)}
                </span>
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Fecha de inicio:</strong>{' '}
                {formatDate(membership.start_date)}
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Fecha de renovación:</strong>{' '}
                {formatDate(membership.renewal_date)}
              </p>
              {membership.auto_renew && (
                <p className="text-sm">
                  ✓ Renovación automática activa
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleEdit} variant="outline">
              Gestionar Membresía
            </Button>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-primary text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Beneficios Incluidos
          </h3>
          <ul className="space-y-2">
            {membership.plan_type === 'spirit' ? (
              <>
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="text-[#FF1493]">✓</span>
                  Compartir con una persona
                </li>
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="text-[#FF1493]">✓</span>
                  Descuentos en servicios
                </li>
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="text-[#FF1493]">✓</span>
                  Acceso prioritario a eventos
                </li>
              </>
            ) : (
              <>
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="text-blue-600">✓</span>
                  Descuentos básicos
                </li>
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="text-blue-600">✓</span>
                  Newsletter exclusiva
                </li>
              </>
            )}
          </ul>
        </div>
      </Card>

      {/* Shared Membership Section */}
      {membership.plan_type === 'spirit' && (
        <Card padding="large" className="mb-8">
          <h2 className="font-primary text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Membresía Compartida
          </h2>

          {sharedMembership ? (
            <div>
              <SharedMembershipCard 
                sharedMembership={sharedMembership} 
                onRevoke={handleRevoke}
                loading={actionLoading}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Aún no has compartido tu membresía Spirit
              </p>
              <Button onClick={() => navigate('/membership/share')}>
                Compartir Membresía
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Referral Program Card */}
      <Card padding="large" className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-2 border-[#FF1493]">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="text-6xl">🎁</div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-primary text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Programa de Referidos
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Invita a 4 amigas, cuando se suscriban todas obtienen un mes gratis. 
              Además, participarás en el sorteo trimestral de 1 año de membresía gratis.
            </p>
          </div>
          <div>
            <Button 
              onClick={() => navigate('/referidos')}
              variant="primary"
              className="whitespace-nowrap"
            >
              Ver Mi Progreso
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Membership
