import { Link } from 'react-router-dom'
import Card from '../components/common/Card'
import LoginForm from '../modules/auth/LoginForm'
import './Login.css'

const Login = () => {
  return (
    <div className="login-page">

        <LoginForm />
        <div className="login-footer">
          <p>
            ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
          </p>
        </div>

    </div>
  )
}

export default Login
