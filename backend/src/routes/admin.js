import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  getAdminStats,
  deleteUser,
} from '../controllers/adminController.js'

const router = express.Router()

// Todas las rutas de admin requieren autenticación
router.use(authenticate)

// Obtener todos los usuarios
router.get('/users', getAllUsers)

// Obtener estadísticas del panel de admin
router.get('/stats', getAdminStats)

// Obtener un usuario específico
router.get('/users/:id', getUserById)

// Actualizar el rol de un usuario
router.patch('/users/:id/role', updateUserRole)

// Eliminar un usuario
router.delete('/users/:id', deleteUser)

export default router
