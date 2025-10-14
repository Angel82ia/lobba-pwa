import { Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import PropTypes from 'prop-types'
import useStore from '../../store'
import { isTokenValid, getStoredToken } from '../../services/auth'

const ProtectedRoute = ({ children, requiredRole, requireMembership = false }) => {
  const { auth, logout } = useStore()
  const token = getStoredToken()

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'logout-event') {
        logout()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [logout])

  if (!token || !isTokenValid(token)) {
    if (auth.isAuthenticated) {
      logout()
    }
    return <Navigate to="/login" replace />
  }

  if (requiredRole && auth.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  if (requireMembership && auth.user?.membershipStatus !== 'active') {
    return <Navigate to="/membership-required" replace />
  }

  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.oneOf(['user', 'salon', 'admin', 'device']),
  requireMembership: PropTypes.bool,
}

export default ProtectedRoute
