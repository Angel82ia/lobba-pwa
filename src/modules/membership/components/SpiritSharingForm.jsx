import { useState } from 'react'
import PropTypes from 'prop-types'
import { createSharedMembership } from '../../../services/sharedMembership'
import Card from '../../../components/common/Card'

const SpiritSharingForm = ({ membershipId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    sharedWithName: '',
    sharedWithBirthdate: '',
    relation: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const calculateAge = (birthdate) => {
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.sharedWithName.trim()) {
      setError('El nombre es requerido')
      return
    }

    if (!formData.sharedWithBirthdate) {
      setError('La fecha de nacimiento es requerida')
      return
    }

    const age = calculateAge(formData.sharedWithBirthdate)
    if (age < 0) {
      setError('La fecha de nacimiento no puede ser futura')
      return
    }

    try {
      setLoading(true)
      await createSharedMembership(membershipId, formData)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al compartir membresía')
    } finally {
      setLoading(false)
    }
  }

  const age = formData.sharedWithBirthdate ? calculateAge(formData.sharedWithBirthdate) : null
  const isMinor = age !== null && age < 18

  return (
    <Card variant="glass" className="spirit-sharing-form">
      <div className="form-header">
        <h2>Compartir Membresía Spirit</h2>
        <p>Comparte tu membresía con un familiar o amiga</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="sharedWithName">
            Nombre completo *
          </label>
          <input
            type="text"
            id="sharedWithName"
            name="sharedWithName"
            value={formData.sharedWithName}
            onChange={handleChange}
            placeholder="María García López"
            required
            disabled={loading}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="sharedWithBirthdate">
            Fecha de nacimiento *
          </label>
          <input
            type="date"
            id="sharedWithBirthdate"
            name="sharedWithBirthdate"
            value={formData.sharedWithBirthdate}
            onChange={handleChange}
            required
            disabled={loading}
            className="form-input"
            max={new Date().toISOString().split('T')[0]}
          />
          {isMinor && (
            <div className="form-hint minor-warning">
              ⚠️ Esta persona es menor de edad ({age} años)
            </div>
          )}
          {age !== null && !isMinor && (
            <div className="form-hint">
              ✓ {age} años
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="relation">
            Relación (opcional)
          </label>
          <select
            id="relation"
            name="relation"
            value={formData.relation}
            onChange={handleChange}
            disabled={loading}
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

        <div className="info-box">
          <h4>Información importante:</h4>
          <ul>
            <li>Solo las membresías Spirit pueden compartirse</li>
            <li>Puedes compartir con una persona a la vez</li>
            <li>Ambas podrán disfrutar de los beneficios completos</li>
            <li>Puedes revocar el acceso en cualquier momento</li>
          </ul>
        </div>

        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="btn-secondary"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Compartiendo...' : 'Compartir Membresía'}
          </button>
        </div>
      </form>
    </Card>
  )
}

SpiritSharingForm.propTypes = {
  membershipId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func
}

export default SpiritSharingForm
