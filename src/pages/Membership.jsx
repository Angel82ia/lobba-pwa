import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import SharedMembershipCard from '../modules/membership/components/SharedMembershipCard'
import { getActiveMembership, getSharedMembership, revokeSharedMembership } from '../services/membership'
import './Membership.css'

const Membership = () => {
  const { auth } = useStore()
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
            console.error('Error fetching shared membership:', err)
          }
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No tienes una membresía activa')
      } else {
        setError('Error al cargar tu membresía')
      }
      console.error('Error loading membership:', err)
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
      console.error('Error revoking shared membership:', err)
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
      <div className="membership-page">
        <div className="loading">Cargando tu membresía...</div>
      </div>
    )
  }

  if (error && !membership) {
    return (
      <div className="membership-page">
        <Card>
          <div className="no-membership">
            <h2>No tienes una membresía activa</h2>
            <p>Suscríbete a una de nuestras membresías para disfrutar de beneficios exclusivos.</p>
            <Button onClick={() => navigate('/membership/checkout')}>
              Ver Planes de Membresía
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="membership-page">
      <h1>Mi Membresía</h1>

      <Card className="membership-card">
        <div className="membership-header">
          <div className="membership-type">
            <h2>Membresía {getMembershipTypeLabel(membership.plan_type)}</h2>
            <span className={`status-badge ${membership.status}`}>
              {getMembershipStatusLabel(membership.status)}
            </span>
          </div>
        </div>

        <div className="membership-details">
          <div className="detail-row">
            <span className="label">Estado:</span>
            <span className="value">{getMembershipStatusLabel(membership.status)}</span>
          </div>

          <div className="detail-row">
            <span className="label">Fecha de inicio:</span>
            <span className="value">{formatDate(membership.start_date)}</span>
          </div>

          {membership.expiry_date && (
            <div className="detail-row">
              <span className="label">Renovación:</span>
              <span className="value">{formatDate(membership.expiry_date)}</span>
            </div>
          )}

          <div className="detail-row">
            <span className="label">Renovación automática:</span>
            <span className="value">{membership.auto_renew ? 'Activada' : 'Desactivada'}</span>
          </div>
        </div>

        <div className="membership-actions">
          <Button variant="secondary" onClick={() => navigate('/membership/manage')}>
            Gestionar Membresía
          </Button>
        </div>
      </Card>

      {membership.plan_type === 'spirit' && sharedMembership && (
        <SharedMembershipCard
          sharedMembership={sharedMembership}
          onEdit={handleEdit}
          onRevoke={handleRevoke}
          loading={actionLoading}
        />
      )}

      {membership.plan_type === 'spirit' && !sharedMembership && (
        <Card className="share-cta">
          <h3>Comparte tu membresía</h3>
          <p>
            Con tu membresía Spirit, puedes compartir los beneficios con una persona especial.
          </p>
          <Button onClick={() => navigate('/membership/share')}>
            Compartir Membresía
          </Button>
        </Card>
      )}
    </div>
  )
}

export default Membership
