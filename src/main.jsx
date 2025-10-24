import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import './styles/tailwind.css'
import 'leaflet/dist/leaflet.css'
import { registerSW } from 'virtual:pwa-register'

// Registrar el Service Worker para PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nueva versión disponible. ¿Deseas actualizar?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    // App lista para funcionar offline
  },
})

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)
