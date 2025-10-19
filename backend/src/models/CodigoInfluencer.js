import pool from '../config/database.js'

export const findCodigoByValue = async codigo => {
  const result = await pool.query(
    'SELECT * FROM codigos_influencers WHERE codigo = $1 AND activo = TRUE',
    [codigo.toUpperCase()]
  )
  return result.rows[0]
}

export const createCodigo = async ({ codigo, nombreInfluencer, emailInfluencer }) => {
  const result = await pool.query(
    `INSERT INTO codigos_influencers (codigo, nombre_influencer, email_influencer, activo)
     VALUES ($1, $2, $3, TRUE)
     RETURNING *`,
    [codigo.toUpperCase(), nombreInfluencer, emailInfluencer]
  )
  return result.rows[0]
}

export const getAllCodigos = async () => {
  const result = await pool.query(
    'SELECT * FROM codigos_influencers ORDER BY fecha_creacion DESC'
  )
  return result.rows
}

export const deactivateCodigo = async codigo => {
  const result = await pool.query(
    'UPDATE codigos_influencers SET activo = FALSE WHERE codigo = $1 RETURNING *',
    [codigo.toUpperCase()]
  )
  return result.rows[0]
}

export const getReportesInfluencers = async () => {
  const result = await pool.query('SELECT * FROM vista_reportes_influencers')
  return result.rows
}
