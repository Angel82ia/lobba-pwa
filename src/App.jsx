import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/layouts/MainLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import LoginForm from './modules/auth/LoginForm'
import RegisterForm from './modules/auth/RegisterForm'
import ProtectedRoute from './components/routes/ProtectedRoute'
import ClientProfile from './modules/profile/ClientProfile'
import EditProfile from './modules/profile/EditProfile'
import SalonProfile from './modules/salon/SalonProfile'
import EditSalonProfile from './modules/salon/EditSalonProfile'
import AdminDashboard from './modules/admin/AdminDashboard'
import DeviceRegistration from './modules/devices/DeviceRegistration'
import ReservationList from './modules/reservations/ReservationList'
import ReservationCalendar from './modules/reservations/ReservationCalendar'
import ChatWindow from './modules/messaging/ChatWindow'
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
            path="profile/:id?"
            element={
              <ProtectedRoute>
                <ClientProfile />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="profile/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          
          <Route path="salon/:id" element={<SalonProfile />} />
          
          <Route
            path="salon/:id/edit"
            element={
              <ProtectedRoute requiredRole="salon">
                <EditSalonProfile />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="device/register"
            element={
              <ProtectedRoute requiredRole="device">
                <DeviceRegistration />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="reservations"
            element={
              <ProtectedRoute>
                <ReservationList />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="reservations/new/:salonId"
            element={
              <ProtectedRoute>
                <ReservationCalendar />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="messages"
            element={
              <ProtectedRoute>
                <ChatWindow />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="messages/:conversationId"
            element={
              <ProtectedRoute>
                <ChatWindow />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
