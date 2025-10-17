import { Link } from 'react-router-dom'
import RegisterForm from '../modules/auth/RegisterForm'

const Register = () => {
  return (
    <div className="min-h-[calc(100vh-20rem)] flex flex-col items-center justify-center py-12 px-4">
      <RegisterForm />
      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <Link 
            to="/login" 
            className="text-[#FF1493] font-semibold hover:text-[#C71585] hover:underline transition-colors"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
