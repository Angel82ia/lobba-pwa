import { useTheme } from '../../contexts/ThemeContext'
import './ThemeToggle.css'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      className={`theme-toggle ${theme === 'dark' ? 'theme-toggle-active' : ''}`}
      onClick={toggleTheme}
      aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
      title={`Modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      <div className="theme-toggle-track">
        <div className="theme-toggle-thumb">
          {theme === 'light' ? (
            <span className="theme-icon">☀️</span>
          ) : (
            <span className="theme-icon">🌙</span>
          )}
        </div>
      </div>
    </button>
  )
}

export default ThemeToggle
