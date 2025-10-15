import pg from 'pg'
import { databaseConfig, poolErrorHandler } from './databaseConfig.js'

const { Pool } = pg

const pool = new Pool(databaseConfig)

pool.on('error', poolErrorHandler)

export default pool
