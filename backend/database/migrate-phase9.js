import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from '../src/config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigrations() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Running Phase 9 migrations...')
    
    const migrations = [
      '034_create_device_capabilities_table.sql',
      '035_create_items_table.sql',
      '036_create_equipment_table.sql',
      '037_create_use_permissions_table.sql',
      '038_create_device_events_table.sql',
      '039_extend_user_quotas_table.sql'
    ]

    for (const migration of migrations) {
      const filePath = path.join(__dirname, 'migrations', migration)
      const sql = fs.readFileSync(filePath, 'utf8')
      
      console.log(`Running ${migration}...`)
      await client.query(sql)
      console.log(`✅ ${migration} completed`)
    }
    
    console.log('🎉 Phase 9 migrations completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    client.release()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default runMigrations
