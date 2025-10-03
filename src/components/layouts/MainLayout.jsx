import { Link, Outlet } from 'react-router-dom'
import useStore from '../../store'
import BannerDisplay from '../../modules/banners/BannerDisplay'
import ChatbotWidget from '../../modules/chatbot/ChatbotWidget'
import ThemeToggle from '../common/ThemeToggle'
import './MainLayout.css'

const MainLayout = () => {
  const { auth } = useStore()
  
  return (
    <div className="main-layout">
      <header className="main-header">
        <div className="header-content">
          <div className="logo">LOBBA</div>
          <nav className="main-nav">
            <Link to="/">Inicio</Link>
            <Link to="/salones">Salones</Link>
            <Link to="/tienda">Tienda</Link>
            <Link to="/comunidad">Comunidad</Link>
          </nav>
          <div className="header-actions">
            <ThemeToggle />
            <Link to="/login">Iniciar Sesión</Link>
          </div>
        </div>
      </header>
      
      <BannerDisplay />
      
      <main className="main-content">
        <Outlet />
      </main>
      
      <footer className="main-footer">
        <div className="footer-content">
          <p>&copy; 2024 LOBBA. Todos los derechos reservados.</p>
        </div>
      </footer>
      
      {auth.isAuthenticated && <ChatbotWidget />}
    </div>
  )
}

export default MainLayout
