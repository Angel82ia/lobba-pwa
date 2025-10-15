import dotenv from 'dotenv'

dotenv.config()

const isTest = process.env.NODE_ENV === 'test'
const databaseUrl = isTest ? process.env.DATABASE_URL_TEST : process.env.DATABASE_URL

// Detectar si la base de datos requiere SSL
const requiresSSL =
  databaseUrl &&
  (databaseUrl.includes('supabase.co') ||
    databaseUrl.includes('amazonaws.com') ||
    databaseUrl.includes('heroku.com') ||
    databaseUrl.includes('sslmode=require'))

// Si la URL explícitamente dice que no use SSL, respetarlo
const explicitNoSSL =
  databaseUrl && (databaseUrl.includes('sslmode=disable') || databaseUrl.includes('ssl=false'))

// Configuración SSL específica por proveedor
const getSSLConfig = () => {
  if (explicitNoSSL) return false
  if (!requiresSSL) return false

  // Todos los proveedores cloud requieren SSL pero sin verificación estricta
  // debido a certificados intermedios y proxies
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
