import dotenv from 'dotenv'

dotenv.config()

const isTest = process.env.NODE_ENV === 'test'
const databaseUrl = isTest ? process.env.DATABASE_URL_TEST : process.env.DATABASE_URL

// Detectar el proveedor de base de datos
const isSupabase = databaseUrl && databaseUrl.includes('supabase.co')
const requiresSSL =
  databaseUrl &&
  (databaseUrl.includes('amazonaws.com') ||
    databaseUrl.includes('heroku.com') ||
    isSupabase ||
    databaseUrl.includes('sslmode=require'))

// Si la URL explícitamente dice que no use SSL, respetarlo
const explicitNoSSL =
  databaseUrl && (databaseUrl.includes('sslmode=disable') || databaseUrl.includes('ssl=false'))

// Configuración SSL específica por proveedor
const getSSLConfig = () => {
  if (explicitNoSSL) return false
  if (!requiresSSL) return false

  // Supabase requiere SSL con verificación de certificados
  if (isSupabase) {
    return {
      rejectUnauthorized: true,
    }
  }

  // Otros proveedores (AWS RDS, Heroku Postgres, etc.)
  return {
    rejectUnauthorized: false,
  }
}

export const databaseConfig = {
  connectionString: databaseUrl,
  ssl: getSSLConfig(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

export const poolErrorHandler = err => {
  console.error('Unexpected error on idle PostgreSQL client:', err)
  process.exit(-1)
}
