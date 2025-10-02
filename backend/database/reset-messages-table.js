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

const main = async () => {
  try {
    console.log('🗑️  Dropping messages table...')
    await pool.query('DROP TABLE IF EXISTS messages CASCADE')
    console.log('✅ Messages table dropped')
    
    console.log('📝 Recreating messages table...')
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations', '010_create_messages_table.sql'),
      'utf8'
    )
    await pool.query(sql)
    console.log('✅ Messages table recreated with correct schema')
  } catch (error) {
    console.error('❌ Failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
