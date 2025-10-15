import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { getSharedMembershipByMembershipId, revokeSharedMembership, updateSharedMembership } from '../../../services/sharedMembership'
import Card from '../../../components/common/Card'
import './SpiritSharingList.css'

const SpiritSharingList = ({ membershipId, onRevoke }) => {
  const [sharedMembership, setSharedMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    sharedWithName: '',
    sharedWithBirthdate: '',
    relation: ''
  })
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadSharedMembership()
  }, [membershipId])

  const loadSharedMembership = async () => {
    try {
      setLoading(true)
      const data = await getSharedMembershipByMembershipId(membershipId)
      setSharedMembership(data)
      if (data) {
        setEditForm({
          sharedWithName: data.shared_with_name,
          sharedWithBirthdate: data.shared_with_birthdate?.split('T')[0],
          relation: data.relation || ''
        })
      }
    } catch (err) {
      console.error('Error loading shared membership:', err)
      setError('Error cargando información de membresía compartida')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async () => {
    if (!window.confirm('¿Estás segura de que quieres revocar el acceso compartido? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setActionLoading(true)
      await revokeSharedMembership(sharedMembership.id)
      setSharedMembership(null)
      if (onRevoke) {
        onRevoke()
      }
    } catch (err) {
      console.error('Error revoking shared membership:', err)
      alert('Error al revocar membresía compartida')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm({
      sharedWithName: sharedMembership.shared_with_name,
      sharedWithBirthdate: sharedMembership.shared_with_birthdate?.split('T')[0],
      relation: sharedMembership.relation || ''
    })
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const updated = await updateSharedMembership(sharedMembership.id, editForm)
      setSharedMembership(updated)
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating shared membership:', err)
      alert('Error al actualizar membresía compartida')
    } finally {
      setActionLoading(false)
    }
  }

  const calculateAge = (birthdate) => {
    if (!birthdate) return null
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const formatRelation = (relation) => {
    const relations = {
      daughter: 'Hija',
      mother: 'Madre',
      sister: 'Hermana',
      friend: 'Amiga',
      partner: 'Pareja',
      other: 'Otra'
    }
    return relations[relation] || relation
  }

  if (loading) {
    return (
      <Card variant="glass" className="spirit-sharing-list">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card variant="error" className="spirit-sharing-list">
        <p>{error}</p>
      </Card>
    )
  }

  if (!sharedMembership) {
    return (
      <Card variant="info" className="spirit-sharing-list">
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No has compartido tu membresía</h3>
          <p>Comparte tu membresía Spirit con un familiar o amiga para que ambas disfruten de todos los beneficios.</p>
        </div>
      </Card>
    )
  }

  const age = calculateAge(sharedMembership.shared_with_birthdate)
  const isMinor = age !== null && age < 18

  return (
    <Card variant="glass" className="spirit-sharing-list">
      <div className="shared-header">
        <h3>Membresía Compartida</h3>
        {sharedMembership.status === 'active' && (
          <span className="status-badge active">Activa</span>
        )}
        {sharedMembership.status === 'revoked' && (
          <span className="status-badge revoked">Revocada</span>
        )}
      </div>

      {!isEditing ? (
        <div className="shared-details">
          <div className="detail-row">
            <div className="detail-icon">👤</div>
            <div className="detail-content">
              <div className="detail-label">Nombre</div>
              <div className="detail-value">{sharedMembership.shared_with_name}</div>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-icon">🎂</div>
            <div className="detail-content">
              <div className="detail-label">Fecha de nacimiento</div>
              <div className="detail-value">
                {new Date(sharedMembership.shared_with_birthdate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
                {age !== null && (
                  <span className={`age-badge ${isMinor ? 'minor' : ''}`}>
                    {age} años {isMinor && '(menor)'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {sharedMembership.relation && (
            <div className="detail-row">
              <div className="detail-icon">❤️</div>
              <div className="detail-content">
                <div className="detail-label">Relación</div>
                <div className="detail-value">{formatRelation(sharedMembership.relation)}</div>
              </div>
            </div>
          )}

          <div className="detail-row">
            <div className="detail-icon">📅</div>
            <div className="detail-content">
              <div className="detail-label">Compartida desde</div>
              <div className="detail-value">
                {new Date(sharedMembership.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>

          {sharedMembership.status === 'active' && (
            <div className="shared-actions">
              <button
                onClick={handleEdit}
                disabled={actionLoading}
                className="btn-secondary"
              >
                ✏️ Editar
              </button>
              <button
                onClick={handleRevoke}
                disabled={actionLoading}
                className="btn-danger"
              >
                {actionLoading ? 'Revocando...' : '🚫 Revocar Acceso'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSaveEdit} className="edit-form">
          <div className="form-group">
            <label htmlFor="edit-name">Nombre completo</label>
            <input
              type="text"
              id="edit-name"
              name="sharedWithName"
              value={editForm.sharedWithName}
              onChange={handleEditChange}
              required
              disabled={actionLoading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-birthdate">Fecha de nacimiento</label>
            <input
              type="date"
              id="edit-birthdate"
              name="sharedWithBirthdate"
              value={editForm.sharedWithBirthdate}
              onChange={handleEditChange}
              required
              disabled={actionLoading}
              className="form-input"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-relation">Relación</label>
            <select
              id="edit-relation"
              name="relation"
              value={editForm.relation}
              onChange={handleEditChange}
              disabled={actionLoading}
              className="form-select"
            >
              <option value="">Selecciona una relación</option>
              <option value="daughter">Hija</option>
              <option value="mother">Madre</option>
              <option value="sister">Hermana</option>
              <option value="friend">Amiga</option>
              <option value="partner">Pareja</option>
              <option value="other">Otra</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={actionLoading}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="btn-primary"
            >
              {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}
    </Card>
  )
}

SpiritSharingList.propTypes = {
  membershipId: PropTypes.string.isRequired,
  onRevoke: PropTypes.func
}

export default SpiritSharingList
