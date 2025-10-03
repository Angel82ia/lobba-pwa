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
import ProductGrid from './modules/ecommerce/ProductGrid'
import ProductDetail from './modules/ecommerce/ProductDetail'
import Cart from './modules/ecommerce/Cart'
import CheckoutForm from './modules/ecommerce/CheckoutForm'
import Wishlist from './modules/ecommerce/Wishlist'
import NotificationSettings from './modules/notifications/NotificationSettings'
import NotificationComposer from './modules/notifications/NotificationComposer'
import NotificationHistory from './modules/notifications/NotificationHistory'
import NotificationDashboard from './modules/notifications/NotificationDashboard'
import NailsGenerator from './modules/ai-nails/NailsGenerator'
import HairstyleTryOn from './modules/hairstyle/HairstyleTryOn'
import MyDesigns from './modules/ai-nails/MyDesigns'
import CommunityFeed from './modules/community/CommunityFeed'
import UserProfile from './modules/community/UserProfile'
import CatalogGrid from './modules/catalog/CatalogGrid'
import DesignDetail from './modules/catalog/DesignDetail'
import BannerManagement from './modules/banners/BannerManagement'
import ItemRequestForm from './modules/remote-equipment/ItemRequestForm'
import EquipmentRequestForm from './modules/remote-equipment/EquipmentRequestForm'
import UserPermissionHistory from './modules/remote-equipment/UserPermissionHistory'
import DeviceManagement from './modules/admin/DeviceManagement'
import InventoryManagement from './modules/admin/InventoryManagement'
import KioskMode from './modules/kiosk/KioskMode'
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
          
          <Route path="tienda" element={<ProductGrid />} />
          <Route path="tienda/:category" element={<ProductGrid />} />
          <Route path="producto/:slug" element={<ProductDetail />} />
          <Route path="carrito" element={<Cart />} />
          
          <Route
            path="wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="checkout"
            element={
              <ProtectedRoute>
                <CheckoutForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="notificaciones/configuracion"
            element={
              <ProtectedRoute>
                <NotificationSettings />
              </ProtectedRoute>
            }
          />

          <Route
            path="notificaciones/enviar"
            element={
              <ProtectedRoute>
                <NotificationComposer />
              </ProtectedRoute>
            }
          />

          <Route
            path="notificaciones/historial"
            element={
              <ProtectedRoute>
                <NotificationHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="admin/notificaciones"
            element={
              <ProtectedRoute requiredRole="admin">
                <NotificationDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="ai/unas"
            element={
              <ProtectedRoute>
                <NailsGenerator />
              </ProtectedRoute>
            }
          />

          <Route
            path="ai/peinados"
            element={
              <ProtectedRoute>
                <HairstyleTryOn />
              </ProtectedRoute>
            }
          />

          <Route
            path="ai/mis-disenos"
            element={
              <ProtectedRoute>
                <MyDesigns />
              </ProtectedRoute>
            }
          />

          <Route
            path="comunidad"
            element={
              <ProtectedRoute>
                <CommunityFeed />
              </ProtectedRoute>
            }
          />

          <Route
            path="comunidad/perfil/:userId"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          <Route path="catalogo" element={<CatalogGrid />} />
          <Route path="catalogo/:id" element={<DesignDetail />} />
          
          <Route
            path="admin/banners"
            element={
              <ProtectedRoute requiredRole="admin">
                <BannerManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="equipos/solicitar-articulo"
            element={
              <ProtectedRoute>
                <ItemRequestForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="equipos/solicitar-equipo"
            element={
              <ProtectedRoute>
                <EquipmentRequestForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="equipos/mis-permisos"
            element={
              <ProtectedRoute>
                <UserPermissionHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="admin/dispositivos"
            element={
              <ProtectedRoute requiredRole="admin">
                <DeviceManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="admin/inventario"
            element={
              <ProtectedRoute requiredRole="admin">
                <InventoryManagement />
              </ProtectedRoute>
            }
          />

          <Route path="kiosk" element={<KioskMode />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
