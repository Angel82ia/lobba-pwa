#!/usr/bin/env node

import dotenv from 'dotenv'
import pool from '../src/config/database.js'

dotenv.config()

const salonId = process.argv[2] || '58459050-91fe-4dae-aae5-2ac2b4186c1a'

async function checkBlocks() {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        start_time,
        end_time,
        block_type,
        title,
        google_calendar_event_id,
        created_at
      FROM availability_blocks
      WHERE salon_profile_id = $1
        AND is_active = true
      ORDER BY created_at DESC
      LIMIT 10`,
      [salonId]
    )

    console.log(`\n📅 Bloqueos de disponibilidad (${result.rows.length}):\n`)

    if (result.rows.length === 0) {
      console.log('  No hay bloqueos activos')
      console.log('\n💡 Para probar:')
      console.log('  1. Crea un evento en Google Calendar')
      console.log('  2. Ejecuta POST /google-calendar/sync/:salonId')
      console.log('  3. Ejecuta este script de nuevo\n')
    } else {
      result.rows.forEach((block, index) => {
        console.log(`${index + 1}. ${block.title}`)
        console.log(`   Tipo: ${block.block_type}`)
        console.log(`   Inicio: ${block.start_time}`)
        console.log(`   Fin: ${block.end_time}`)
        console.log(`   Google Event ID: ${block.google_calendar_event_id || 'N/A'}`)
        console.log('')
      })
    }

    await pool.end()
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

checkBlocks()
