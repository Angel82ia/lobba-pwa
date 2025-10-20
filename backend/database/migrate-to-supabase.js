import pg from 'pg'
import { readdir, readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))

// Usar DATABASE_URL de producción (Supabase)
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function applyMigrationsToProduction() {
  console.log('🚀 Aplicando migraciones a PRODUCCIÓN (Supabase)...')
  console.log('⚠️  ADVERTENCIA: Esto modificará la base de datos de producción\n')

  try {
    // Verificar conexión
    const testQuery = await pool.query('SELECT current_database(), current_user')
    console.log(`📊 Conectado a: ${testQuery.rows[0].current_database}`)
    console.log(`👤 Usuario: ${testQuery.rows[0].current_user}\n`)

    const migrationsDir = join(__dirname, 'migrations')
    const files = await readdir(migrationsDir)
    const migrationFiles = files.filter(f => f.endsWith('.sql')).sort()

    let applied = 0
    let skipped = 0
    let errors = 0
    const errorDetails = []

    for (const file of migrationFiles) {
      try {
        const filepath = join(migrationsDir, file)
        const sql = await readFile(filepath, 'utf-8')

        await pool.query(sql)
        console.log(`✅ ${file}`)
        applied++
      } catch (error) {
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate') ||
          error.message.includes('IF NOT EXISTS')
        ) {
          console.log(`⏭️  ${file} (ya aplicada)`)
          skipped++
        } else {
          console.log(`❌ ${file}: ${error.message.split('\n')[0]}`)
          errors++
          errorDetails.push({ file, error: error.message })
        }
      }
    }

    console.log(`\n📊 Resumen de Migraciones:`)
    console.log(`   ✅ Aplicadas: ${applied}`)
    console.log(`   ⏭️  Omitidas: ${skipped}`)
    console.log(`   ❌ Errores: ${errors}`)

    if (errorDetails.length > 0) {
      console.log(`\n⚠️  Detalles de errores:`)
      errorDetails.forEach(({ file, error }) => {
        console.log(`\n${file}:`)
        console.log(`   ${error.substring(0, 200)}...`)
      })
    }

    console.log(`\n✨ Proceso completado!`)
  } catch (error) {
    console.error('\n❌ Error general:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Confirmación de seguridad
console.log('\n⚠️  ¡ATENCIÓN! Vas a aplicar migraciones a PRODUCCIÓN (Supabase)')
console.log('Presiona Ctrl+C para cancelar o espera 3 segundos para continuar...\n')

setTimeout(() => {
  applyMigrationsToProduction()
}, 3000)
