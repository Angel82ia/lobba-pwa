import { Link } from 'react-router-dom'
import Card from '../components/common/Card'
import RegisterForm from '../modules/auth/RegisterForm'
import './Register.css'

const Register = () => {
  return (
    <div className="register-page">

        <RegisterForm />
        <div className="register-footer">
          <p>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>

    </div>
  )
}

export default Register
