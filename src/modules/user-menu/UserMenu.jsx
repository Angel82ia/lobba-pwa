import { Link, useNavigate } from 'react-router-dom'
import useStore from '../../store'
import Dropdown from '../../components/common/Dropdown'
import { logout as logoutService } from '../../services/auth'

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
    return (
      <Link 
        to="/login" 
        className="text-gray-900 dark:text-white hover:text-[#FF1493] transition-colors font-medium"
      >
        Iniciar Sesión
      </Link>
    )
  }

  const trigger = (
    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
      {auth.user?.avatar ? (
        <img 
          src={auth.user.avatar} 
          alt={auth.user.firstName || 'Usuario'} 
          className="w-8 h-8 rounded-full object-cover border-2 border-[#FF1493]"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-[#FF1493] text-white flex items-center justify-center font-bold text-sm">
          {(auth.user?.firstName?.[0] || 'U').toUpperCase()}
        </div>
      )}
      <span className="text-gray-900 dark:text-white font-medium hidden md:inline">
        {auth.user?.firstName || 'Usuario'}
      </span>
      <span className="text-gray-500 dark:text-gray-400 text-xs">▼</span>
    </div>
  )

  return (
    <Dropdown trigger={trigger} align="right">
      {(closeMenu) => (
        <>
          <Link
            to={`/profile/${auth.user?.id}`}
            className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={closeMenu}
          >
            Mi Perfil
          </Link>
          <Link
            to="/membership"
            className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={closeMenu}
          >
            Mi Membresía
          </Link>
          <Link
            to="/referidos"
            className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={closeMenu}
          >
          Programa de Referidos
          </Link>
          {auth.role === 'salon' && (
            <Link
              to={`/salon/${auth.user?.salonId}/edit`}
              className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={closeMenu}
            >
              Mi Salón
            </Link>
          )}
          <button
            className="block w-full text-left px-4 py-2 text-[#EF4444] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
