import pool from '../config/database.js'
import bcrypt from 'bcrypt'

export const validateSalonRow = (row, lineNumber) => {
  const errors = []

  if (!row.business_name || row.business_name.trim() === '') {
    errors.push(`Line ${lineNumber}: business_name is required`)
  }

  if (!row.address || row.address.trim() === '') {
    errors.push(`Line ${lineNumber}: address is required`)
  }

  if (!row.city || row.city.trim() === '') {
    errors.push(`Line ${lineNumber}: city is required`)
  }

  if (row.latitude && (isNaN(row.latitude) || row.latitude < -90 || row.latitude > 90)) {
    errors.push(`Line ${lineNumber}: invalid latitude (must be between -90 and 90)`)
  }

  if (row.longitude && (isNaN(row.longitude) || row.longitude < -180 || row.longitude > 180)) {
    errors.push(`Line ${lineNumber}: invalid longitude (must be between -180 and 180)`)
  }

  if (row.email && !row.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push(`Line ${lineNumber}: invalid email format`)
  }

  return { valid: errors.length === 0, errors }
}

export const parseSalonCSV = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim())
  
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header and one data row')
  }

  const headers = lines[0].split(',').map(h => h.trim())
  const results = {
    valid: [],
    invalid: []
  }

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row = {}

    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    const validation = validateSalonRow(row, i + 1)

    if (validation.valid) {
      results.valid.push(row)
    } else {
      results.invalid.push({ row, errors: validation.errors })
    }
  }

  return results
}

export const importSalons = async (validatedData, adminUserId) => {
  const client = await pool.connect()
  const results = {
    success: 0,
    failed: 0,
    errors: []
  }

  try {
    await client.query('BEGIN')

    for (const salonData of validatedData) {
      try {
        const email = salonData.email || `salon_${Date.now()}_${Math.random().toString(36).substring(7)}@lobba.generated.com`
        const tempPassword = Math.random().toString(36).substring(2, 10)
        const hashedPassword = await bcrypt.hash(tempPassword, 10)

        const userResult = await client.query(
          `INSERT INTO users (email, password, first_name, last_name, role) 
           VALUES ($1, $2, $3, $4, 'salon') 
           RETURNING id`,
          [email, hashedPassword, salonData.business_name, '', ]
        )

        const userId = userResult.rows[0].id

        let location = null
        if (salonData.latitude && salonData.longitude) {
          location = `POINT(${salonData.longitude} ${salonData.latitude})`
        }

        await client.query(
          `INSERT INTO salon_profiles 
           (user_id, business_name, description, address, city, postal_code, phone, website, location, accepts_reservations)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${location ? 'ST_GeogFromText($9)' : 'NULL'}, $${location ? 10 : 9})`,
          location 
            ? [userId, salonData.business_name, salonData.description || '', salonData.address, salonData.city, salonData.postal_code || '', salonData.phone || '', salonData.website || '', `POINT(${salonData.longitude} ${salonData.latitude})`, salonData.accepts_reservations === 'true']
            : [userId, salonData.business_name, salonData.description || '', salonData.address, salonData.city, salonData.postal_code || '', salonData.phone || '', salonData.website || '', salonData.accepts_reservations === 'true']
        )

        results.success++
      } catch (err) {
        results.failed++
        results.errors.push({ 
          salon: salonData.business_name, 
          error: err.message 
        })
      }
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }

  return results
}
