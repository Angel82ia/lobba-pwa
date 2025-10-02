import PropTypes from 'prop-types'
import './Card.css'

const Card = ({
  children,
  variant = 'default',
  padding = 'medium',
  onClick,
  className = '',
  ...props
}) => {
  const classNames = [
    'card',
    `card-${variant}`,
    `card-padding-${padding}`,
    onClick && 'card-clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classNames} onClick={onClick} {...props}>
      {children}
    </div>
  )
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'outlined', 'elevated']),
  padding: PropTypes.oneOf(['none', 'small', 'medium', 'large']),
  onClick: PropTypes.func,
  className: PropTypes.string,
}

export default Card
