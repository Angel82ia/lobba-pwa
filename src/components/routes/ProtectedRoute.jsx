import { Navigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import useStore from '../../store'
import { isTokenValid, getStoredToken } from '../../services/auth'

const ProtectedRoute = ({ children, requiredRole, requireMembership = false }) => {
  const { auth } = useStore()
  const token = getStoredToken()

  if (!token || !isTokenValid(token)) {
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
