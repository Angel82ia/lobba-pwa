import { useState } from 'react'
import PropTypes from 'prop-types'
import { Input, Select, Alert, Card } from '../../../components/common'

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

  const relationOptions = [
    { value: '', label: 'Selecciona una relación' },
    { value: 'hija', label: 'Hija' },
    { value: 'hijo', label: 'Hijo' },
    { value: 'madre', label: 'Madre' },
    { value: 'padre', label: 'Padre' },
    { value: 'hermana', label: 'Hermana' },
    { value: 'hermano', label: 'Hermano' },
    { value: 'amiga', label: 'Amiga' },
    { value: 'amigo', label: 'Amigo' },
    { value: 'pareja', label: 'Pareja' },
    { value: 'otro', label: 'Otro' },
  ]

  return (
    <Card padding="large">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Checkbox Principal */}
        <div className="bg-purple-50 dark:bg-purple-950 rounded-xl p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={share}
              onChange={(e) => setShare(e.target.checked)}
              disabled={disabled}
              className="w-5 h-5 text-[#FF1493] rounded border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#FF1493] cursor-pointer mt-0.5"
            />
            <div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white block mb-1">
                Compartir mi membresía con alguien especial
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comparte los beneficios de tu membresía Spirit con una persona querida
              </p>
            </div>
          </label>
        </div>

        {/* Form Fields */}
        {share && (
          <div className="space-y-6">
            <Input
              label="Nombre completo de la persona *"
              id="sharedWithName"
              type="text"
              value={sharedWithName}
              onChange={(e) => setSharedWithName(e.target.value)}
              disabled={disabled}
              error={errors.sharedWithName}
              placeholder="Ej: María Pérez"
              fullWidth
            />

            <div>
              <label htmlFor="sharedWithBirthdate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Fecha de nacimiento <span className="text-red-500">*</span>
              </label>
              <input
                id="sharedWithBirthdate"
                type="date"
                value={sharedWithBirthdate}
                onChange={handleBirthdateChange}
                disabled={disabled}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  errors.sharedWithBirthdate
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-[#FF1493]'
                }`}
              />
              {errors.sharedWithBirthdate && (
                <p className="mt-1.5 text-sm text-red-500">{errors.sharedWithBirthdate}</p>
              )}
              {isMinor && sharedWithBirthdate && !errors.sharedWithBirthdate && (
                <Alert variant="warning" className="mt-3">
                  ⚠️ La persona beneficiaria es menor de edad. Como titular, asumes la responsabilidad legal del uso de la membresía.
                </Alert>
              )}
            </div>

            <Select
              label="Relación (opcional)"
              id="relation"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              disabled={disabled}
              options={relationOptions}
              fullWidth
            />

            <Alert variant="info">
              <p className="text-sm">
                Al compartir tu membresía, aceptas que como titular mantienes la responsabilidad legal completa de la membresía. 
                La persona beneficiaria no tendrá acceso a gestionar o modificar la membresía.
              </p>
            </Alert>
          </div>
        )}
      </form>
    </Card>
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
