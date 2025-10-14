import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import './Dropdown.css'

const Dropdown = ({ trigger, children, align = 'right' }) => {
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

  return (
    <div className="dropdown" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div className={`dropdown-menu dropdown-menu-${align}`}>
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
}

export default Dropdown

