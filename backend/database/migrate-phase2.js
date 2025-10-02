import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs/promises'
import pool from '../src/config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runMigration(filePath) {
  const sql = await fs.readFile(filePath, 'utf-8')
  await pool.query(sql)
  console.log(`✅ Migration completed: ${filePath}`)
}

async function main() {
  console.log('🚀 Running Phase 2 database migrations only...')
  
  const migrationsDir = join(__dirname, 'migrations')
  const phase2Migrations = [
    '004_create_salon_profiles_table.sql',
    '005_create_salon_categories_table.sql',
    '006_create_salon_services_table.sql',
    '007_create_salon_gallery_table.sql',
    '008_create_device_profiles_table.sql',
  ]

  for (const migration of phase2Migrations) {
    const filePath = join(migrationsDir, migration)
    try {
      await runMigration(filePath)
    } catch (error) {
      console.error(`❌ Migration failed: ${error.message}`)
      process.exit(1)
    }
  }

  console.log('✅ All Phase 2 migrations completed successfully!')
  await pool.end()
  process.exit(0)
}

main()
