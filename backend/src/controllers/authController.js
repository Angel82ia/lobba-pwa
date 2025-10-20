import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByEmailWithSalon,
  findUserByIdWithSalon,
} from '../models/User.js'
import {
  createRefreshToken,
  findRefreshToken,
  revokeAllUserTokens,
} from '../models/RefreshToken.js'
import {
  hashPassword,
  comparePasswords,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/auth.js'
import { validationResult } from 'express-validator'
import logger from '../utils/logger.js'
import { findCodigoByValue } from '../models/CodigoInfluencer.js'
import { enviarRegistroASheet } from '../services/googleSheetsService.js'
import { registerReferral } from '../services/referralService.js'
import { validarCodigoInfluencer } from '../services/influencerCodeService.js'
import pool from '../config/database.js'

export const register = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password, firstName, lastName, role = 'user', codigo_referido, codigo_amigas } = req.body

    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    let tipoDescuento = 'ninguno'
    let codigoReferidoFinal = null
    let usarProgramaReferidos = false
    
    if (codigo_amigas) {
      const codigoTrimmed = codigo_amigas.trim().toUpperCase()
      const referralCodeResult = await pool.query(
        'SELECT id FROM users WHERE referral_code = $1',
        [codigoTrimmed]
      )
      
      if (referralCodeResult.rows.length > 0) {
        usarProgramaReferidos = true
        tipoDescuento = 'referido_amigas'
        logger.info(`Aplicando programa de referidos con código ${codigoTrimmed} (PRIORIDAD 1)`)
      }
    }
    
    if (!usarProgramaReferidos && codigo_referido) {
      const codigoTrimmed = codigo_referido.trim().toUpperCase()
      const codigoExistente = await validarCodigoInfluencer(codigoTrimmed)
      if (codigoExistente) {
        codigoReferidoFinal = codigoTrimmed
        tipoDescuento = 'codigo_influencer'
        logger.info(`Aplicando código influencer ${codigoTrimmed} (PRIORIDAD 2)`)
      } else {
        logger.warn(`Código de influencer inválido intentado: ${codigoTrimmed}`)
      }
    }

    const passwordHash = await hashPassword(password)
    const user = await createUser({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      codigoReferido: codigoReferidoFinal,
    })
    
    await pool.query(
      'UPDATE users SET tipo_descuento_aplicado = $1 WHERE id = $2',
      [tipoDescuento, user.id]
    )
    
    if (usarProgramaReferidos) {
      try {
        await registerReferral(user.id, codigo_amigas.trim().toUpperCase())
        logger.info(`Usuario ${user.id} registrado en programa de referidos`)
      } catch (error) {
        logger.error('Error registrando en programa de referidos:', error)
      }
    }

    if (codigoReferidoFinal) {
      enviarRegistroASheet({
        codigo: codigoReferidoFinal,
        nombre: `${firstName} ${lastName}`,
        email: email,
      }).catch(err => logger.error('Error enviando a Google Sheets (no crítico):', err))
    }

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await createRefreshToken(user.id, refreshToken, expiresAt)

    const userWithSalon = await findUserByIdWithSalon(user.id)

    res.status(201).json({
      user: {
        id: userWithSalon.id,
        email: userWithSalon.email,
        firstName: userWithSalon.first_name,
        lastName: userWithSalon.last_name,
        role: userWithSalon.role,
        membershipActive: userWithSalon.membership_active,
        salonId: userWithSalon.salon_profile_id || null,
        tipoDescuento,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    logger.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
}

export const login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        errors: errors.array(),
      })
    }

    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos',
      })
    }

    const user = await findUserByEmailWithSalon(email)

    if (!user || !user.password_hash) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'El email o la contraseña son incorrectos',
      })
    }

    const isValidPassword = await comparePasswords(password, user.password_hash)

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'El email o la contraseña son incorrectos',
      })
    }

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await createRefreshToken(user.id, refreshToken, expiresAt)

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        membershipActive: user.membership_active,
        salonId: user.salon_profile_id || null,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo.',
    })
  }
}

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' })
    }

    const decoded = verifyRefreshToken(refreshToken)
    const storedToken = await findRefreshToken(refreshToken)

    if (!storedToken) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    const user = await findUserById(decoded.userId)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    const accessToken = generateAccessToken(user)

    res.json({ accessToken })
  } catch (error) {
    logger.error('Refresh error:', error)
    res.status(401).json({ error: 'Invalid or expired refresh token' })
  }
}

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.substring(7)

    if (token) {
      await revokeAllUserTokens(req.user.id)
    }

    res.status(204).send()
  } catch (error) {
    logger.error('Logout error:', error)
    res.status(500).json({ error: 'Logout failed' })
  }
}

export const me = async (req, res) => {
  try {
    const user = await findUserByIdWithSalon(req.user.id)

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      membershipActive: user.membership_active,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.created_at,
      salonId: user.salon_profile_id || null,
    })
  } catch (error) {
    logger.error('Me error:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
}
