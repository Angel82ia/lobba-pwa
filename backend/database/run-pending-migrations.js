import pg from 'pg'
import { readdir, readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function runAllMigrations() {
  try {
    console.log('🚀 Ejecutando migraciones pendientes...')
    
    const migrationsDir = join(__dirname, 'migrations')
    const files = await readdir(migrationsDir)
    const migrationFiles = files.filter(f => f.endsWith('.sql')).sort()
    
    // Saltar las 3 primeras (ya ejecutadas)
    const pendingMigrations = migrationFiles.slice(3)
    
    for (const file of pendingMigrations) {
      console.log(`Ejecutando: ${file}`)
      const filepath = join(migrationsDir, file)
      const sql = await readFile(filepath, 'utf-8')
      
      try {
        await pool.query(sql)
        console.log(`✅ ${file} completado`)
      } catch (error) {
        console.log(`⚠️ ${file} - ${error.message}`)
      }
    }
    
    console.log('✨ Migraciones completadas')
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    await pool.end()
    process.exit(1)
  }
}

runAllMigrations()
