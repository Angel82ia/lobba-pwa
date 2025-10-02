import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

const runMigration = async (filename) => {
  const sql = readFileSync(join(__dirname, 'migrations', filename), 'utf-8')
  await pool.query(sql)
  console.log(`✅ Migration ${filename} completed`)
}

const main = async () => {
  try {
    console.log('🚀 Running database migrations...')
    
    await runMigration('001_create_users_table.sql')
    await runMigration('002_create_refresh_tokens_table.sql')
    await runMigration('003_create_audit_logs_table.sql')
    
    console.log('✅ All migrations completed successfully')
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    await pool.end()
    process.exit(1)
  }
}

main()
