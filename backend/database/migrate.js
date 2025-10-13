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
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Crear tabla de control de migraciones
async function createMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

// Obtener migraciones ya ejecutadas
async function getExecutedMigrations() {
  const result = await pool.query('SELECT version FROM schema_migrations ORDER BY version')
  return new Set(result.rows.map(row => row.version))
}

// Registrar migración ejecutada
async function recordMigration(version) {
  await pool.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version])
}

// Ejecutar una migración
async function runMigration(filename, sql) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(sql)
    await recordMigration(filename)
    await client.query('COMMIT')
    console.log(`✅ Migration ${filename} completed`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function main() {
  try {
    console.log('🚀 Running database migrations...')
    
    // Crear tabla de control
    await createMigrationsTable()
    
    // Obtener migraciones ya ejecutadas
    const executed = await getExecutedMigrations()
    
    // Leer archivos de migración
    const migrationsDir = join(__dirname, 'migrations')
    const files = await readdir(migrationsDir)
    const migrationFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort()
    
    let newMigrations = 0
    
    // Ejecutar solo las pendientes
    for (const file of migrationFiles) {
      if (executed.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`)
        continue
      }
      
      const filepath = join(migrationsDir, file)
      const sql = await readFile(filepath, 'utf-8')
      await runMigration(file, sql)
      newMigrations++
    }
    
    if (newMigrations === 0) {
      console.log('✨ All migrations are up to date')
    } else {
      console.log(`✅ Executed ${newMigrations} new migration(s)`)
    }
    
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    await pool.end()
    process.exit(1)
  }
}

main()
