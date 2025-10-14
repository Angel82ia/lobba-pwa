import PropTypes from 'prop-types'
import './LiquidGlassIcon.css'

const LiquidGlassIcon = ({ 
  icon, 
  size = 'md', 
  animated = false,
  glow = false,
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'icon-xs',
    sm: 'icon-sm',
    md: 'icon-md',
    lg: 'icon-lg',
    xl: 'icon-xl'
  }

  const classNames = [
    'liquid-glass-icon',
    sizeClasses[size],
    animated && 'icon-animated',
    glow && 'icon-glow',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classNames}>
      <div className="icon-background"></div>
      <div className="icon-content">
        {icon}
      </div>
    </div>
  )
}

LiquidGlassIcon.propTypes = {
  icon: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  animated: PropTypes.bool,
  glow: PropTypes.bool,
  className: PropTypes.string
}

export default LiquidGlassIcon
