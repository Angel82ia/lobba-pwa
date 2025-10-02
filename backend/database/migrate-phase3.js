import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

const runMigration = async (filename) => {
  const filePath = path.join(__dirname, 'migrations', filename)
  const sql = fs.readFileSync(filePath, 'utf8')
  
  try {
    console.log(`Running migration: ${filename}`)
    await pool.query(sql)
    console.log(`✅ ${filename} completed`)
  } catch (error) {
    console.error(`❌ ${filename} failed:`, error.message)
    throw error
  }
}

const main = async () => {
  try {
    console.log('🚀 Running Phase 3 database migrations...')
    
    await runMigration('009_create_reservations_table.sql')
    await runMigration('010_create_messages_table.sql')
    
    console.log('✅ All Phase 3 migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
