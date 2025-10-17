import PropTypes from 'prop-types'

const Card = ({
  children,
  variant = 'default',
  padding = 'medium',
  hover = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-xl transition-all duration-200'
  
  const variantClasses = {
    default: 'shadow-md border border-gray-200 dark:border-gray-700',
    outlined: 'border-2 border-gray-200 dark:border-gray-700',
    elevated: 'shadow-xl border border-gray-200 dark:border-gray-700',
  }

  const paddingClasses = {
    none: 'p-0',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  }

  const cardClasses = [
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    hover && 'hover:shadow-lg hover:-translate-y-1',
    onClick && 'cursor-pointer',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div 
      className={cardClasses} 
      onClick={onClick} 
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'outlined', 'elevated']),
  padding: PropTypes.oneOf(['none', 'small', 'medium', 'large']),
  hover: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
}

export default Card
