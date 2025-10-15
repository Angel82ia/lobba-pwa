import { useTheme } from '../../contexts/ThemeContext'
import './ThemeToggle.css'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      className="theme-toggle liquid-glass glass-button"
      onClick={toggleTheme}
      aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
      title={`Modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      <div className={`theme-toggle-track ${theme}`}>
        <div className="theme-toggle-thumb glass-float">
          <span className="theme-icon">
            {theme === 'light' ? '☀️' : '🌙'}
          </span>
        </div>
      </div>
    </button>
  )
}

export default ThemeToggle
