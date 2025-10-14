import { useState } from 'react'
import PropTypes from 'prop-types'
import './SharedMembershipForm.css'

const SharedMembershipForm = ({ membership, onSubmit, disabled = false }) => {
  const [share, setShare] = useState(false)
  const [sharedWithName, setSharedWithName] = useState('')
  const [sharedWithBirthdate, setSharedWithBirthdate] = useState('')
  const [relation, setRelation] = useState('')
  const [errors, setErrors] = useState({})
  const [isMinor, setIsMinor] = useState(false)

  const calculateAge = (birthdate) => {
    if (!birthdate) return null
    const today = new Date()
    const birthDate = new Date(birthdate)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const handleBirthdateChange = (e) => {
    const date = e.target.value
    setSharedWithBirthdate(date)
    
    if (date) {
      const age = calculateAge(date)
      setIsMinor(age < 18)
    } else {
      setIsMinor(false)
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!sharedWithName.trim()) {
      newErrors.sharedWithName = 'El nombre es obligatorio'
    }

    if (!sharedWithBirthdate) {
      newErrors.sharedWithBirthdate = 'La fecha de nacimiento es obligatoria'
    } else {
      const birthDate = new Date(sharedWithBirthdate)
      const today = new Date()
      
      if (birthDate > today) {
        newErrors.sharedWithBirthdate = 'La fecha de nacimiento no puede ser futura'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!share) {
      onSubmit(null)
      return
    }

    if (!validate()) {
      return
    }

    onSubmit({
      sharedWithName: sharedWithName.trim(),
      sharedWithBirthdate,
      relation: relation.trim() || null,
    })
  }

  if (!membership || membership.planType !== 'spirit') {
    return null
  }

  return (
    <div className="shared-membership-form">
      <div className="share-checkbox-container">
        <label className="share-checkbox-label">
          <input
            type="checkbox"
            checked={share}
            onChange={(e) => setShare(e.target.checked)}
            disabled={disabled}
            className="share-checkbox"
          />
          <span className="share-checkbox-text">
            Compartir mi membresía con alguien especial
          </span>
        </label>
        <p className="share-checkbox-description">
          Comparte los beneficios de tu membresía Spirit con una persona querida
        </p>
      </div>

      {share && (
        <div className="share-form-fields">
          <div className="form-field">
            <label htmlFor="sharedWithName" className="form-label">
              Nombre completo de la persona <span className="required">*</span>
            </label>
            <input
              id="sharedWithName"
              type="text"
              value={sharedWithName}
              onChange={(e) => setSharedWithName(e.target.value)}
              disabled={disabled}
              className={`form-input ${errors.sharedWithName ? 'error' : ''}`}
              placeholder="Ej: María Pérez"
            />
            {errors.sharedWithName && (
              <p className="error-message">{errors.sharedWithName}</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="sharedWithBirthdate" className="form-label">
              Fecha de nacimiento <span className="required">*</span>
            </label>
            <input
              id="sharedWithBirthdate"
              type="date"
              value={sharedWithBirthdate}
              onChange={handleBirthdateChange}
              disabled={disabled}
              max={new Date().toISOString().split('T')[0]}
              className={`form-input ${errors.sharedWithBirthdate ? 'error' : ''}`}
            />
            {errors.sharedWithBirthdate && (
              <p className="error-message">{errors.sharedWithBirthdate}</p>
            )}
            {isMinor && sharedWithBirthdate && !errors.sharedWithBirthdate && (
              <p className="minor-warning">
                ⚠️ La persona beneficiaria es menor de edad. Como titular, asumes la responsabilidad legal del uso de la membresía.
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="relation" className="form-label">
              Relación (opcional)
            </label>
            <select
              id="relation"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              disabled={disabled}
              className="form-input"
            >
              <option value="">Selecciona una relación</option>
              <option value="hija">Hija</option>
              <option value="hijo">Hijo</option>
              <option value="madre">Madre</option>
              <option value="padre">Padre</option>
              <option value="hermana">Hermana</option>
              <option value="hermano">Hermano</option>
              <option value="amiga">Amiga</option>
              <option value="amigo">Amigo</option>
              <option value="pareja">Pareja</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="legal-notice">
            <p>
              Al compartir tu membresía, aceptas que como titular mantienes la responsabilidad legal completa de la membresía. 
              La persona beneficiaria no tendrá acceso a gestionar o modificar la membresía.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

SharedMembershipForm.propTypes = {
  membership: PropTypes.shape({
    id: PropTypes.string,
    planType: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}

export default SharedMembershipForm
