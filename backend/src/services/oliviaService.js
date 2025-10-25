import { GoogleGenerativeAI } from '@google/generative-ai'
import pool from '../config/database.js'
import OLIVIA_SYSTEM_PROMPT from '../config/oliviaSystemPrompt.js'
import { compileMasterDocument } from './masterDocsService.js'
import { listCalendars } from './googleCalendarService.js'

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY
const genAI = GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(GOOGLE_AI_API_KEY) : null

/**
 * Buscar salones por ubicación, servicio o nombre
 */
async function searchSalons({ query, city, service }) {
  let sqlQuery = `
    SELECT 
      sp.id,
      sp.business_name,
      sp.description,
      sp.address,
      sp.city,
      sp.phone,
      sp.rating,
      sp.total_reviews,
      sp.accepts_reservations,
      ST_AsText(sp.location) as location_text
    FROM salon_profiles sp
    WHERE sp.is_active = true
  `
  
  const params = []
  let paramIndex = 1
  
  if (city) {
    sqlQuery += ` AND LOWER(sp.city) LIKE LOWER($${paramIndex})`
    params.push(`%${city}%`)
    paramIndex++
  }
  
  if (query) {
    sqlQuery += ` AND (
      LOWER(sp.business_name) LIKE LOWER($${paramIndex})
      OR LOWER(sp.description) LIKE LOWER($${paramIndex})
    )`
    params.push(`%${query}%`)
    paramIndex++
  }
  
  sqlQuery += ` ORDER BY sp.rating DESC, sp.total_reviews DESC LIMIT 10`
  
  const result = await pool.query(sqlQuery, params)
  
  if (service && result.rows.length > 0) {
    const salonIds = result.rows.map(s => s.id)
    const servicesResult = await pool.query(
      `SELECT DISTINCT salon_id 
       FROM salon_services 
       WHERE salon_id = ANY($1) 
       AND LOWER(name) LIKE LOWER($2)`,
      [salonIds, `%${service}%`]
    )
    
    const salonsWithService = new Set(servicesResult.rows.map(r => r.salon_id))
    return result.rows.filter(salon => salonsWithService.has(salon.id))
  }
  
  return result.rows
}

/**
 * Obtener información detallada de un salón
 */
async function getSalonDetails({ salonId }) {
  const salonResult = await pool.query(
    `SELECT 
      sp.*,
      ST_AsText(sp.location) as location_text,
      u.email as owner_email
    FROM salon_profiles sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.id = $1`,
    [salonId]
  )
  
  if (salonResult.rows.length === 0) {
    return { error: 'Salón no encontrado' }
  }
  
  const salon = salonResult.rows[0]
  
  const servicesResult = await pool.query(
    `SELECT id, name, description, price, duration_minutes, category
     FROM salon_services
     WHERE salon_id = $1
     ORDER BY category, name`,
    [salonId]
  )
  
  const hoursResult = await pool.query(
    `SELECT day_of_week, open_time, close_time, is_closed
     FROM salon_hours
     WHERE salon_id = $1
     ORDER BY day_of_week`,
    [salonId]
  )
  
  return {
    salon,
    services: servicesResult.rows,
    hours: hoursResult.rows
  }
}

/**
 * Verificar disponibilidad en Google Calendar
 */
async function checkAvailability({ salonId, date }) {
  try {
    const salonResult = await pool.query(
      `SELECT google_calendar_enabled, google_refresh_token
       FROM salon_profiles
       WHERE id = $1`,
      [salonId]
    )
    
    if (salonResult.rows.length === 0) {
      return { error: 'Salón no encontrado' }
    }
    
    const salon = salonResult.rows[0]
    
    if (!salon.google_calendar_enabled || !salon.google_refresh_token) {
      return { 
        error: 'Este salón no tiene calendario configurado',
        message: 'El salón aún no ha configurado su calendario de disponibilidad'
      }
    }
    
    const blocksResult = await pool.query(
      `SELECT 
        start_time,
        end_time,
        is_available,
        reason
       FROM availability_blocks
       WHERE salon_id = $1
       AND DATE(start_time) = $2
       ORDER BY start_time`,
      [salonId, date]
    )
    
    return {
      date,
      slots: blocksResult.rows
    }
  } catch (error) {
    console.error('Error checking availability:', error)
    return { 
      error: 'Error al verificar disponibilidad',
      message: error.message
    }
  }
}

/**
 * Buscar productos en e-commerce
 */
async function searchProducts({ query, category, minPrice, maxPrice }) {
  let sqlQuery = `
    SELECT 
      id,
      name,
      description,
      price,
      category,
      brand,
      stock_quantity,
      image_url
    FROM products
    WHERE is_active = true
  `
  
  const params = []
  let paramIndex = 1
  
  if (query) {
    sqlQuery += ` AND (
      LOWER(name) LIKE LOWER($${paramIndex})
      OR LOWER(description) LIKE LOWER($${paramIndex})
      OR LOWER(brand) LIKE LOWER($${paramIndex})
    )`
    params.push(`%${query}%`)
    paramIndex++
  }
  
  if (category) {
    sqlQuery += ` AND LOWER(category) = LOWER($${paramIndex})`
    params.push(category)
    paramIndex++
  }
  
  if (minPrice !== undefined) {
    sqlQuery += ` AND price >= $${paramIndex}`
    params.push(minPrice)
    paramIndex++
  }
  
  if (maxPrice !== undefined) {
    sqlQuery += ` AND price <= $${paramIndex}`
    params.push(maxPrice)
    paramIndex++
  }
  
  sqlQuery += ` ORDER BY name LIMIT 20`
  
  const result = await pool.query(sqlQuery, params)
  return result.rows
}

/**
 * Obtener información de membresías
 */
async function getMembershipInfo({ membershipType }) {
  const memberships = {
    essential: {
      name: 'Essential',
      benefits: {
        hygiene_units: 16,
        emergency_items: 2,
        powerbanks: 2,
        ar_credits: 50,
        nail_prints: 100,
        ecommerce_discount: 10
      }
    },
    spirit: {
      name: 'Spirit',
      benefits: {
        hygiene_units: 32,
        emergency_items: 4,
        powerbanks: 4,
        ar_credits: 50,
        nail_prints: 100,
        nail_prints_shared: 150,
        ecommerce_discount: 15,
        exclusive_circles: true,
        spirit_badge: true
      }
    }
  }
  
  if (membershipType) {
    return memberships[membershipType.toLowerCase()] || { error: 'Membresía no encontrada' }
  }
  
  return memberships
}

/**
 * Crear una reserva (REQUIERE CONFIRMACIÓN EXPLÍCITA DEL USUARIO)
 */
async function createReservation({ userId, salonId, serviceId, date, time, notes }) {
  try {
    const salonResult = await pool.query(
      `SELECT id, business_name, accepts_reservations
       FROM salon_profiles
       WHERE id = $1 AND is_active = true`,
      [salonId]
    )
    
    if (salonResult.rows.length === 0) {
      return { error: 'Salón no encontrado' }
    }
    
    const salon = salonResult.rows[0]
    
    if (!salon.accepts_reservations) {
      return { error: 'Este salón no acepta reservas online' }
    }
    
    const serviceResult = await pool.query(
      `SELECT id, name, price, duration_minutes
       FROM salon_services
       WHERE id = $1 AND salon_id = $2`,
      [serviceId, salonId]
    )
    
    if (serviceResult.rows.length === 0) {
      return { error: 'Servicio no encontrado' }
    }
    
    const service = serviceResult.rows[0]
    
    const reservationResult = await pool.query(
      `INSERT INTO reservations (
        user_id,
        salon_id,
        service_id,
        reservation_date,
        reservation_time,
        status,
        notes,
        total_price
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
      RETURNING *`,
      [userId, salonId, serviceId, date, time, notes || '', service.price]
    )
    
    const reservation = reservationResult.rows[0]
    
    return {
      success: true,
      reservation: {
        id: reservation.id,
        salon: salon.business_name,
        service: service.name,
        date: reservation.reservation_date,
        time: reservation.reservation_time,
        price: reservation.total_price,
        status: reservation.status
      },
      message: 'Reserva creada exitosamente. Recibirás confirmación por WhatsApp.'
    }
    
  } catch (error) {
    console.error('Error creating reservation:', error)
    return { 
      error: 'Error al crear la reserva',
      message: error.message
    }
  }
}

/**
 * Definición de funciones disponibles para Gemini
 */
const functionDeclarations = [
  {
    name: 'searchSalons',
    description: 'Buscar salones de belleza por ubicación, nombre o servicio',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Texto de búsqueda (nombre del salón, descripción)'
        },
        city: {
          type: 'string',
          description: 'Ciudad donde buscar salones'
        },
        service: {
          type: 'string',
          description: 'Tipo de servicio buscado (ej: corte, tinte, manicura)'
        }
      }
    }
  },
  {
    name: 'getSalonDetails',
    description: 'Obtener información detallada de un salón específico (servicios, precios, horarios)',
    parameters: {
      type: 'object',
      properties: {
        salonId: {
          type: 'string',
          description: 'ID del salón'
        }
      },
      required: ['salonId']
    }
  },
  {
    name: 'checkAvailability',
    description: 'Verificar disponibilidad de un salón en una fecha específica',
    parameters: {
      type: 'object',
      properties: {
        salonId: {
          type: 'string',
          description: 'ID del salón'
        },
        date: {
          type: 'string',
          description: 'Fecha en formato YYYY-MM-DD'
        }
      },
      required: ['salonId', 'date']
    }
  },
  {
    name: 'searchProducts',
    description: 'Buscar productos en el catálogo de e-commerce',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Texto de búsqueda (nombre, marca, descripción)'
        },
        category: {
          type: 'string',
          description: 'Categoría del producto (cabello, piel, maquillaje, uñas)'
        },
        minPrice: {
          type: 'number',
          description: 'Precio mínimo'
        },
        maxPrice: {
          type: 'number',
          description: 'Precio máximo'
        }
      }
    }
  },
  {
    name: 'getMembershipInfo',
    description: 'Obtener información sobre membresías Essential o Spirit',
    parameters: {
      type: 'object',
      properties: {
        membershipType: {
          type: 'string',
          description: 'Tipo de membresía: "essential" o "spirit"',
          enum: ['essential', 'spirit']
        }
      }
    }
  },
  {
    name: 'createReservation',
    description: 'Crear una reserva en un salón. IMPORTANTE: Solo llamar después de confirmación EXPLÍCITA del usuario. Debe confirmar: salón, servicio, fecha, hora y precio.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'ID del usuario que hace la reserva'
        },
        salonId: {
          type: 'string',
          description: 'ID del salón'
        },
        serviceId: {
          type: 'string',
          description: 'ID del servicio a reservar'
        },
        date: {
          type: 'string',
          description: 'Fecha de la reserva en formato YYYY-MM-DD'
        },
        time: {
          type: 'string',
          description: 'Hora de la reserva en formato HH:MM'
        },
        notes: {
          type: 'string',
          description: 'Notas adicionales de la reserva (opcional)'
        }
      },
      required: ['userId', 'salonId', 'serviceId', 'date', 'time']
    }
  }
]

/**
 * Ejecutar función llamada por Gemini
 */
async function executeFunction(functionCall, userId) {
  const { name, args } = functionCall
  
  switch (name) {
    case 'searchSalons':
      return await searchSalons(args)
    case 'getSalonDetails':
      return await getSalonDetails(args)
    case 'checkAvailability':
      return await checkAvailability(args)
    case 'searchProducts':
      return await searchProducts(args)
    case 'getMembershipInfo':
      return await getMembershipInfo(args)
    case 'createReservation':
      return await createReservation({ ...args, userId })
    default:
      return { error: `Función desconocida: ${name}` }
  }
}

/**
 * Generar respuesta de Olivia con Google AI Studio
 */
export async function generateOliviaResponse(userMessage, conversationHistory = [], userId = null) {
  if (!genAI) {
    throw new Error('Google AI API key not configured. Please set GOOGLE_AI_API_KEY in .env')
  }
  
  try {
    const masterDoc = await compileMasterDocument()
    
    const fullSystemPrompt = `${OLIVIA_SYSTEM_PROMPT}

# DOCUMENTO MAESTRO DE INFORMACIÓN

${masterDoc}

---

Usa esta información para responder preguntas sobre LOBBA. Si algo no está en el documento, di que no tienes esa información específica.`
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: fullSystemPrompt,
      tools: [{ functionDeclarations }]
    })
    
    const history = conversationHistory.slice(-10).map(msg => ({
      role: msg.sender_type === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))
    
    const chat = model.startChat({ history })
    
    let result = await chat.sendMessage(userMessage)
    let response = result.response
    
    let functionCallsExecuted = []
    while (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0]
      console.log('🔧 Olivia calling function:', functionCall.name, functionCall.args)
      
      const functionResult = await executeFunction(functionCall, userId)
      functionCallsExecuted.push({
        name: functionCall.name,
        args: functionCall.args,
        result: functionResult
      })
      
      result = await chat.sendMessage([{
        functionResponse: {
          name: functionCall.name,
          response: functionResult
        }
      }])
      
      response = result.response
    }
    
    const finalText = response.text()
    
    return {
      response: finalText,
      provider: 'google-ai-studio',
      model: 'gemini-2.0-flash-exp',
      functionCalls: functionCallsExecuted
    }
    
  } catch (error) {
    console.error('❌ Error generating Olivia response:', error)
    throw error
  }
}

export default {
  generateOliviaResponse,
  searchSalons,
  getSalonDetails,
  checkAvailability,
  searchProducts,
  getMembershipInfo
}
