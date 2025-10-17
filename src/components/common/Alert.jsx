import PropTypes from 'prop-types'

const Alert = ({
  children,
  variant = 'info',
  title,
  onClose,
  className = '',
}) => {
  const variantClasses = {
    info: 'bg-blue-50 dark:bg-blue-950 border-[#3B82F6] text-blue-900 dark:text-blue-100',
    success: 'bg-green-50 dark:bg-green-950 border-[#10B981] text-green-900 dark:text-green-100',
    warning: 'bg-yellow-50 dark:bg-yellow-950 border-[#F59E0B] text-yellow-900 dark:text-yellow-100',
    error: 'bg-red-50 dark:bg-red-950 border-[#EF4444] text-red-900 dark:text-red-100',
  }

  const alertClasses = [
    'px-4 py-3 rounded-lg border flex items-start gap-3',
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={alertClasses} role="alert">
      <div className="flex-1">
        {title && (
          <h4 className="font-semibold mb-1">
            {title}
          </h4>
        )}
        <div className={title ? 'text-sm' : ''}>
          {children}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-3 text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Cerrar"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

Alert.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  title: PropTypes.string,
  onClose: PropTypes.func,
  className: PropTypes.string,
}

export default Alert
