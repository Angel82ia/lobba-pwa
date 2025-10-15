import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { getSharedMembershipByMembershipId } from '../../../services/sharedMembership'
import SpiritSharingForm from './SpiritSharingForm'
import SpiritSharingList from './SpiritSharingList'
import './SpiritSharingDashboard.css'

const SpiritSharingDashboard = ({ membershipId, membershipType }) => {
  const [hasShared, setHasShared] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    checkSharedStatus()
  }, [membershipId])

  const checkSharedStatus = async () => {
    try {
      setLoading(true)
      const shared = await getSharedMembershipByMembershipId(membershipId)
      setHasShared(!!shared)
    } catch (err) {
      console.error('Error checking shared status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    setShowForm(false)
    setHasShared(true)
  }

  const handleRevoke = () => {
    setHasShared(false)
  }

  if (membershipType !== 'spirit') {
    return (
      <div className="spirit-sharing-dashboard">
        <div className="not-available">
          <div className="not-available-icon">🔒</div>
          <h3>Compartir Membresía no disponible</h3>
          <p>Solo las membresías Spirit pueden compartirse. Actualiza tu membresía para poder compartir con un familiar o amiga.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="spirit-sharing-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="spirit-sharing-dashboard">
      <div className="dashboard-header">
        <h2>Compartir Membresía Spirit</h2>
        <p>Comparte tu membresía con un familiar o amiga para que ambas disfruten de todos los beneficios</p>
      </div>

      {!hasShared && !showForm && (
        <div className="cta-section">
          <button
            onClick={() => setShowForm(true)}
            className="btn-share"
          >
            ➕ Compartir Membresía
          </button>
        </div>
      )}

      {showForm && !hasShared && (
        <SpiritSharingForm
          membershipId={membershipId}
          onSuccess={handleSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {hasShared && (
        <SpiritSharingList
          membershipId={membershipId}
          onRevoke={handleRevoke}
        />
      )}
    </div>
  )
}

SpiritSharingDashboard.propTypes = {
  membershipId: PropTypes.string.isRequired,
  membershipType: PropTypes.string.isRequired
}

export default SpiritSharingDashboard
