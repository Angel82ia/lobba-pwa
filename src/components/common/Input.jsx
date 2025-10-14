import { useMemo } from 'react'
import PropTypes from 'prop-types'
import './Input.css'

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  fullWidth = false,
  variant = 'default',
  className = '',
  ...props
}) => {
  const inputId = useMemo(
    () => props.id || `input-${Math.random().toString(36).substr(2, 9)}`,
    [props.id]
  )

  const classNames = [
    'input-wrapper',
    fullWidth && 'input-full-width',
    error && 'input-error',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classNames}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`input-field input-${variant}`}
        {...props}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  )
}

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'liquid-glass']),
  className: PropTypes.string,
  id: PropTypes.string,
}

export default Input
