import pkg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs/promises'

const { Pool } = pkg
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

const migrations = [
  '022_create_user_quotas_table.sql',
  '023_create_ai_generations_table.sql',
  '024_create_ai_catalog_table.sql',
  '025_create_saved_designs_table.sql'
]

async function runMigrations() {
  console.log('🚀 Running Phase 6 migrations...\n')

  for (const migration of migrations) {
    try {
      const filePath = join(__dirname, 'migrations', migration)
      const sql = await fs.readFile(filePath, 'utf-8')
      
      console.log(`Running ${migration}...`)
      await pool.query(sql)
      console.log(`✅ ${migration} completed\n`)
    } catch (error) {
      console.error(`❌ Error running ${migration}:`, error.message)
      throw error
    }
  }

  console.log('✅ All Phase 6 migrations completed successfully!')
  await pool.end()
}

runMigrations().catch(error => {
  console.error('Migration failed:', error)
  process.exit(1)
})
