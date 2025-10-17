import { Link, Outlet } from 'react-router-dom'
import useStore from '../../store'
import BannerDisplay from '../../modules/banners/BannerDisplay'
import ChatbotWidget from '../../modules/chatbot/ChatbotWidget'
import ThemeToggle from '../common/ThemeToggle'
import UserMenu from '../../modules/user-menu/UserMenu'

const MainLayout = () => {
  const { auth } = useStore()
  
  return (
    <div className="flex flex-col min-h-screen font-secondary">
      {/* Header */}
      <header className="sticky top-0 z-[1020] h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className=" mx-auto h-full px-6 flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-2xl font-bold text-[#FF1493] hover:text-[#C71585] transition-colors no-underline font-primary"
          >
            LOBBA
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex gap-8 font-primary">
            <Link 
              to="/" 
              className="font-medium text-gray-900 dark:text-white hover:text-[#FF1493] transition-colors no-underline"
            >
              Inicio
            </Link>
            <Link 
              to="/salones" 
              className="font-medium text-gray-900 dark:text-white hover:text-[#FF1493] transition-colors no-underline"
            >
              Salones
            </Link>
            <Link 
              to="/tienda" 
              className="font-medium text-gray-900 dark:text-white hover:text-[#FF1493] transition-colors no-underline"
            >
              Tienda
            </Link>
            <Link 
              to="/comunidad" 
              className="font-medium text-gray-900 dark:text-white hover:text-[#FF1493] transition-colors no-underline"
            >
              Comunidad
            </Link>
          </nav>
          
          {/* Header Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>
      
      {/* Banner */}
      <BannerDisplay />
      
      {/* Main Content */}
      <main className="flex-1 w-full  mx-auto">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="h-20 bg-gray-900 dark:bg-black text-white flex items-center justify-center">
        <div className=" w-full px-6 text-center">
          <p>&copy; 2024 LOBBA. Todos los derechos reservados.</p>
        </div>
      </footer>
      
      {/* Chatbot */}
      {auth.isAuthenticated && <ChatbotWidget />}
    </div>
  )
}

export default MainLayout
