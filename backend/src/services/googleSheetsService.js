import { google } from 'googleapis'
import logger from '../utils/logger.js'

let auth = null
let SPREADSHEET_ID = null

export async function initialize() {
  try {
    if (!process.env.GOOGLE_CREDENTIALS_JSON || !process.env.GOOGLE_SHEET_ID) {
      logger.warn('Google Sheets credentials not configured. Skipping initialization.')
      return false
    }

    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON)
    SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID

    auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    logger.info('✅ Google Sheets service initialized')
    return true
  } catch (error) {
    logger.error('❌ Error initializing Google Sheets:', error.message)
    return false
  }
}

export async function enviarRegistroASheet(datos) {
  try {
    if (!auth || !SPREADSHEET_ID) {
      logger.warn('Google Sheets not configured, skipping registration tracking')
      return null
    }

    const sheets = google.sheets({ version: 'v4', auth })

    const valores = [
      [
        new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }),
        datos.codigo,
        datos.nombre,
        datos.email,
        'Registrada',
        'NO',
        '0',
        '',
      ],
    ]

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Registros!A:H',
      valueInputOption: 'USER_ENTERED',
      resource: { values: valores },
    })

    logger.info(`✅ Enviado a Google Sheets: ${datos.email}`)
    return response.data
  } catch (error) {
    logger.error('❌ Error enviando a Google Sheets:', error.message)
    return null
  }
}

export async function actualizarMembresiaPagada(email, montoPagado) {
  try {
    if (!auth || !SPREADSHEET_ID) {
      logger.warn('Google Sheets not configured, skipping membership update')
      return null
    }

    const sheets = google.sheets({ version: 'v4', auth })

    const busqueda = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Registros!A:H',
    })

    const filas = busqueda.data.values || []
    let filaIndex = -1

    for (let i = 1; i < filas.length; i++) {
      if (filas[i][3] === email) {
        filaIndex = i + 1
        break
      }
    }

    if (filaIndex === -1) {
      logger.warn('⚠️ Usuario no encontrado en Sheets:', email)
      return null
    }

    const comision = (montoPagado * 0.1).toFixed(2)

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Registros!F${filaIndex}:G${filaIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [['SÍ', comision]],
      },
    })

    logger.info(`✅ Membresía actualizada: ${email}, comisión: ${comision}€`)
    return { email, comision }
  } catch (error) {
    logger.error('❌ Error actualizando Sheets:', error.message)
    return null
  }
}

export async function testConexion() {
  try {
    if (!auth || !SPREADSHEET_ID) {
      logger.warn('Google Sheets not configured')
      return false
    }

    const sheets = google.sheets({ version: 'v4', auth })
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Registros!A1:A1',
    })

    logger.info('✅ Conexión Google Sheets OK')
    return true
  } catch (error) {
    logger.error('❌ Error conexión Sheets:', error.message)
    return false
  }
}
