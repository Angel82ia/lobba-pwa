import { useMemo } from 'react'
import PropTypes from 'prop-types'

const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Selecciona una opción',
  error,
  disabled = false,
  required = false,
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const selectId = useMemo(
    () => props.id || `select-${Math.random().toString(36).substr(2, 9)}`,
    [props.id]
  )

  const containerClasses = [
    fullWidth ? 'w-full' : 'w-auto',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const selectBaseClasses = 'w-full px-4 py-2.5 pr-10 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-200 appearance-none bg-[url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")] bg-no-repeat bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em]'

  const selectClasses = [
    selectBaseClasses,
    error 
      ? 'border-[#EF4444] focus:ring-[#EF4444]' 
      : 'border-gray-300 dark:border-gray-600 focus:ring-[#FF1493]',
  ]
    .filter(Boolean)
    .join(' ')

  // Si tiene children, usarlos directamente (más flexible)
  // Si tiene options, generarlos automáticamente
  const renderOptions = () => {
    if (children) {
      return children
    }

    return (
      <>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={typeof option === 'object' ? option.value : option} 
            value={typeof option === 'object' ? option.value : option}
            disabled={typeof option === 'object' ? option.disabled : false}
          >
            {typeof option === 'object' ? option.label : option}
          </option>
        ))}
      </>
    )
  }

  return (
    <div className={containerClasses}>
      {label && (
        <label 
          htmlFor={selectId} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
          {required && <span className="text-[#EF4444] ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={selectClasses}
        {...props}
      >
        {renderOptions()}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-[#EF4444]">
          {error}
        </p>
      )}
    </div>
  )
}

Select.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
        disabled: PropTypes.bool,
      }),
    ])
  ),
  placeholder: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
  children: PropTypes.node,
}

export default Select
