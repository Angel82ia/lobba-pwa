import { useMemo } from 'react'
import PropTypes from 'prop-types'

const Textarea = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  fullWidth = false,
  rows = 4,
  maxLength,
  showCharCount = false,
  className = '',
  ...props
}) => {
  const textareaId = useMemo(
    () => props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`,
    [props.id]
  )

  const containerClasses = [
    fullWidth ? 'w-full' : 'w-auto',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const textareaBaseClasses = 'w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-200 resize-y min-h-[80px]'

  const textareaClasses = [
    textareaBaseClasses,
    error 
      ? 'border-[#EF4444] focus:ring-[#EF4444]' 
      : 'border-gray-300 dark:border-gray-600 focus:ring-[#FF1493]',
  ]
    .filter(Boolean)
    .join(' ')

  const characterCount = value?.length || 0
  const isOverLimit = maxLength && characterCount > maxLength

  return (
    <div className={containerClasses}>
      {label && (
        <label 
          htmlFor={textareaId} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
          {required && <span className="text-[#EF4444] ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className={textareaClasses}
        {...props}
      />
      <div className="flex justify-between items-center mt-1.5">
        {error && (
          <p className="text-sm text-[#EF4444] flex-1">
            {error}
          </p>
        )}
        {showCharCount && (
          <p 
            className={`text-xs ml-auto ${
              isOverLimit 
                ? 'text-[#EF4444]' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {characterCount}
            {maxLength && ` / ${maxLength}`}
          </p>
        )}
      </div>
    </div>
  )
}

Textarea.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  rows: PropTypes.number,
  maxLength: PropTypes.number,
  showCharCount: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
}

export default Textarea
