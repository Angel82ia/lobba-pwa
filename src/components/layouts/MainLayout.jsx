import { Outlet } from 'react-router-dom'
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
            <a href="/">Inicio</a>
            <a href="/salons">Salones</a>
            <a href="/shop">Tienda</a>
            <a href="/community">Comunidad</a>
          </nav>
          <div className="header-actions">
            <ThemeToggle />
            <a href="/login">Iniciar Sesión</a>
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
