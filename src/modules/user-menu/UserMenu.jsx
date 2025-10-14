import { Link, useNavigate } from 'react-router-dom'
import useStore from '../../store'
import Dropdown from '../../components/common/Dropdown'
import { logout as logoutService } from '../../services/auth'
import './UserMenu.css'

const UserMenu = () => {
  const { auth, logout: logoutStore } = useStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutService()
    } catch {
      // Continuar con logout local incluso si falla la petición
    } finally {
      logoutStore()
      navigate('/login')
    }
  }

  if (!auth.isAuthenticated) {
    return <Link to="/login" className="login-link">Iniciar Sesión</Link>
  }

  const trigger = (
    <div className="user-menu-trigger">
      {auth.user?.avatar ? (
        <img 
          src={auth.user.avatar} 
          alt={auth.user.firstName || 'Usuario'} 
          className="user-avatar"
        />
      ) : (
        <div className="user-avatar-placeholder">
          {(auth.user?.firstName?.[0] || 'U').toUpperCase()}
        </div>
      )}
      <span className="user-name">{auth.user?.firstName || 'Usuario'}</span>
      <span className="user-menu-icon">▼</span>
    </div>
  )

  return (
    <Dropdown trigger={trigger} align="right">
      {(closeMenu) => (
        <>
          <Link
            to={`/profile/${auth.user?.id}`}
            className="user-menu-item"
            onClick={closeMenu}
          >
            Mi Perfil
          </Link>
          {auth.role === 'salon' && (
            <Link
              to={`/salon/${auth.user?.salonId}/edit`}
              className="user-menu-item"
              onClick={closeMenu}
            >
              Mi Salón
            </Link>
          )}
          <button
            className="user-menu-item user-menu-logout"
            onClick={handleLogout}
          >
            Cerrar Sesión
          </button>
        </>
      )}
    </Dropdown>
  )
}

export default UserMenu

