import { createContext, useContext, useState, useEffect } from 'react'
import PropTypes from 'prop-types'

const ThemeContext = createContext(undefined)

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('lobba-theme')
    return savedTheme || 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    
    // Añadir la clase 'dark' al root para que funcione con Tailwind
    if (theme === 'dark') {
      root.classList.add('dark')
      // Aplicar estilos dark directamente al body
      body.className = 'min-h-screen bg-gray-900 text-white transition-colors duration-200'
    } else {
      root.classList.remove('dark')
      // Aplicar estilos light directamente al body
      body.className = 'min-h-screen bg-white text-gray-900 transition-colors duration-200'
    }
    
    body.style.fontFamily = "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    
    localStorage.setItem('lobba-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
