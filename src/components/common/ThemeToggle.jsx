import { useTheme } from '../../contexts/ThemeContext'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      className="relative inline-flex items-center h-10 w-20 rounded-full transition-colors duration-300 
                 bg-gray-200 dark:bg-gray-700 
                 hover:bg-gray-300 dark:hover:bg-gray-600
                 focus:outline-none focus:ring-2 focus:ring-[#FF1493] focus:ring-offset-2"
      onClick={toggleTheme}
      aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
      title={`Modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      <div
        className={`absolute flex items-center justify-center h-8 w-8 rounded-full 
                   bg-white dark:bg-gray-900 shadow-md
                   transition-transform duration-300 ease-in-out
                   ${theme === 'dark' ? 'translate-x-11' : 'translate-x-1'}`}
      >
        <span className="text-lg" role="img" aria-hidden="true">
          {theme === 'light' ? '☀️' : '🌙'}
        </span>
      </div>
    </button>
  )
}

export default ThemeToggle
