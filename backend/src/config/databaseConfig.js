import dotenv from 'dotenv'

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

export const databaseConfig = {
  connectionString: isTest ? process.env.DATABASE_URL_TEST : process.env.DATABASE_URL,

  ssl: isProduction
    ? {
        rejectUnauthorized: false,
      }
    : false,

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

export const poolErrorHandler = err => {
  console.error('Unexpected error on idle PostgreSQL client:', err)
  process.exit(-1)
}
