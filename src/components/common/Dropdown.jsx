import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

const Dropdown = ({ 
  trigger, 
  children, 
  align = 'right',
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Cerrar dropdown al presionar Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  }

  const menuClasses = [
    'absolute mt-2 min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[1000] py-1',
    'animate-in fade-in slide-in-from-top-2 duration-200',
    alignClasses[align],
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {trigger}
      </div>
      {isOpen && (
        <div className={menuClasses}>
          {typeof children === 'function' ? children(() => setIsOpen(false)) : children}
        </div>
      )}
    </div>
  )
}

Dropdown.propTypes = {
  trigger: PropTypes.node.isRequired,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  align: PropTypes.oneOf(['left', 'right', 'center']),
  className: PropTypes.string,
}

export default Dropdown
