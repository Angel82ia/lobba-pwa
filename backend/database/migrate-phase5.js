import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pool from '../src/config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const migrations = [
  '018_create_user_notification_preferences.sql',
  '019_create_fcm_tokens.sql',
  '020_create_notifications.sql',
  '021_create_notification_rate_limits.sql',
]

const runMigration = async (filename) => {
  try {
    const sql = await readFile(join(__dirname, 'migrations', filename), 'utf-8')
    await pool.query(sql)
    console.log(`✅ ${filename} executed successfully`)
  } catch (error) {
    console.error(`❌ ${filename} failed:`, error.message)
    throw error
  }
}

const main = async () => {
  console.log('🚀 Running Phase 5 (Notifications) migrations...')
  
  try {
    for (const migration of migrations) {
      await runMigration(migration)
    }
    console.log('✅ All Phase 5 migrations completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Phase 5 migration failed:', error)
    process.exit(1)
  }
}

main()
