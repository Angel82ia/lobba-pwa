import { Link } from 'react-router-dom'
import LoginForm from '../modules/auth/LoginForm'

const Login = () => {
  return (
    <div className="min-h-[calc(100vh-20rem)] flex flex-col items-center justify-center py-12 px-4">
      <LoginForm />
      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          ¿No tienes cuenta?{' '}
          <Link 
            to="/register" 
            className="text-[#FF1493] font-semibold hover:text-[#C71585] hover:underline transition-colors"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
