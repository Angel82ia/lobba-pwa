import { useMemo } from 'react'
import PropTypes from 'prop-types'

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
  className = '',
  ...props
}) => {
  const inputId = useMemo(
    () => props.id || `input-${Math.random().toString(36).substr(2, 9)}`,
    [props.id]
  )

  const containerClasses = [
    fullWidth ? 'w-full' : 'w-auto',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const inputBaseClasses = 'w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-200'
  
  const inputClasses = [
    inputBaseClasses,
    error 
      ? 'border-[#EF4444] focus:ring-[#EF4444]' 
      : 'border-gray-300 dark:border-gray-600 focus:ring-[#FF1493]',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClasses}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
          {required && <span className="text-[#EF4444] ml-1">*</span>}
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
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-[#EF4444]">
          {error}
        </p>
      )}
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
  className: PropTypes.string,
  id: PropTypes.string,
}

export default Input
