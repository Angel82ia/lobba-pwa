import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/layouts/MainLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import LoginForm from './modules/auth/LoginForm'
import RegisterForm from './modules/auth/RegisterForm'
import ProtectedRoute from './components/routes/ProtectedRoute'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="auth/login" element={<LoginForm />} />
          <Route path="auth/register" element={<RegisterForm />} />
          
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <div>Profile Page</div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <div>Admin Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
