import { useState } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../components/common/Button'

const SharedMembershipCard = ({ sharedMembership, onEdit, onRevoke, loading = false }) => {
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)

  if (!sharedMembership || sharedMembership.status === 'revoked') {
    return null
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateAge = (birthdate) => {
    const today = new Date()
    const birthDate = new Date(birthdate)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const age = calculateAge(sharedMembership.shared_with_birthdate)
  const isMinor = age < 18

  const handleRevoke = () => {
    setShowRevokeConfirm(false)
    onRevoke(sharedMembership.id)
  }

  return (
    <div className="shared-membership-card">
      <div className="card-header">
        <div className="header-icon">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div className="header-title">
          <h3>Membresía Compartida</h3>
          <span className="status-badge active">Activa</span>
        </div>
      </div>

      <div className="card-content">
        <div className="shared-info">
          <div className="info-row">
            <span className="info-label">Compartida con:</span>
            <span className="info-value">{sharedMembership.shared_with_name}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Fecha de nacimiento:</span>
            <span className="info-value">{formatDate(sharedMembership.shared_with_birthdate)}</span>
            {isMinor && <span className="minor-badge">Menor de edad</span>}
          </div>

          {sharedMembership.relation && (
            <div className="info-row">
              <span className="info-label">Relación:</span>
              <span className="info-value relation">{sharedMembership.relation}</span>
            </div>
          )}

          <div className="info-row">
            <span className="info-label">Compartida desde:</span>
            <span className="info-value">{formatDate(sharedMembership.created_at)}</span>
          </div>
        </div>

        {isMinor && (
          <div className="legal-reminder">
            <p>
              <strong>Recordatorio:</strong> Como titular, eres responsable del uso de esta membresía compartida con un menor de edad.
            </p>
          </div>
        )}
      </div>

      <div className="card-actions">
        <Button
          variant="secondary"
          onClick={onEdit}
          disabled={loading}
          size="small"
        >
          Editar Información
        </Button>
        <Button
          variant="danger"
          onClick={() => setShowRevokeConfirm(true)}
          disabled={loading}
          size="small"
        >
          Revocar Compartición
        </Button>
      </div>

      {showRevokeConfirm && (
        <div className="modal-overlay" onClick={() => setShowRevokeConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>¿Revocar compartición de membresía?</h3>
            <p>
              Esta acción revocará el acceso de <strong>{sharedMembership.shared_with_name}</strong> a los beneficios de tu membresía.
            </p>
            <p className="modal-warning">Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setShowRevokeConfirm(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleRevoke}
                disabled={loading}
              >
                {loading ? 'Revocando...' : 'Sí, Revocar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

SharedMembershipCard.propTypes = {
  sharedMembership: PropTypes.shape({
    id: PropTypes.string.isRequired,
    shared_with_name: PropTypes.string.isRequired,
    shared_with_birthdate: PropTypes.string.isRequired,
    relation: PropTypes.string,
    status: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
  }),
  onEdit: PropTypes.func.isRequired,
  onRevoke: PropTypes.func.isRequired,
  loading: PropTypes.bool,
}

export default SharedMembershipCard
