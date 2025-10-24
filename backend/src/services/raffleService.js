import pool from '../config/database.js'
import logger from '../utils/logger.js'
import cron from 'node-cron'

/**
 * Get current quarter in format Q1-2025, Q2-2025, etc.
 * @returns {string} Current quarter
 */
function getCurrentQuarter() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const quarter = Math.ceil(month / 3)
  return `Q${quarter}-${year}`
}

/**
 * Execute quarterly raffle
 * Selects a random winner from raffle entries of the current quarter
 * @returns {Promise<Object>} Raffle result with winner info
 */
export async function executeQuarterlyRaffle() {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    const currentQuarter = getCurrentQuarter()
    
    const entries = await client.query(
      `SELECT id, user_id FROM raffle_entries
       WHERE quarter = $1 AND is_winner = false
       ORDER BY entry_date ASC`,
      [currentQuarter]
    )
    
    if (entries.rows.length === 0) {
      logger.info(`No hay entradas para el sorteo del trimestre ${currentQuarter}`)
      await client.query('COMMIT')
      return { winner: null, totalEntries: 0, quarter: currentQuarter }
    }
    
    const randomIndex = Math.floor(Math.random() * entries.rows.length)
    const winner = entries.rows[randomIndex]
    
    await client.query(
      `UPDATE raffle_entries
       SET is_winner = true,
           won_at = NOW(),
           prize = '1 year free membership'
       WHERE id = $1`,
      [winner.id]
    )
    
    await client.query(
      `UPDATE users
       SET membership_expiry = COALESCE(membership_expiry, NOW()) + INTERVAL '12 months'
       WHERE id = $1`,
      [winner.user_id]
    )
    
    await client.query(
      `INSERT INTO audit_logs (event, description, metadata, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [
        'QUARTERLY_RAFFLE_COMPLETED',
        `Sorteo trimestral ${currentQuarter} completado`,
        JSON.stringify({
          quarter: currentQuarter,
          winner_user_id: winner.user_id,
          total_entries: entries.rows.length,
          prize: '1 year free membership'
        })
      ]
    )
    
    await client.query('COMMIT')
    
    logger.info(`🎉 Sorteo trimestral ${currentQuarter} completado. Ganador: ${winner.user_id}`)
    
    return {
      winner: winner.user_id,
      totalEntries: entries.rows.length,
      quarter: currentQuarter
    }
    
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Error ejecutando sorteo trimestral:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Get raffle entries for a specific quarter
 * @param {string} quarter - Quarter in format Q1-2025
 * @returns {Promise<Array>} Array of raffle entries
 */
export async function getRaffleEntries(quarter) {
  try {
    const result = await pool.query(
      `SELECT 
        re.id,
        re.user_id,
        re.quarter,
        re.entry_date,
        re.is_winner,
        re.won_at,
        re.prize,
        u.email,
        u.first_name,
        u.last_name
       FROM raffle_entries re
       JOIN users u ON re.user_id = u.id
       WHERE re.quarter = $1
       ORDER BY re.entry_date ASC`,
      [quarter]
    )
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      quarter: row.quarter,
      entryDate: row.entry_date,
      isWinner: row.is_winner,
      wonAt: row.won_at,
      prize: row.prize,
      user: {
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name
      }
    }))
  } catch (error) {
    logger.error('Error getting raffle entries:', error)
    throw error
  }
}

/**
 * Get raffle winners history
 * @param {number} limit - Max number of winners to return
 * @returns {Promise<Array>} Array of winners
 */
export async function getRaffleWinners(limit = 10) {
  try {
    const result = await pool.query(
      `SELECT 
        re.id,
        re.user_id,
        re.quarter,
        re.won_at,
        re.prize,
        u.email,
        u.first_name,
        u.last_name
       FROM raffle_entries re
       JOIN users u ON re.user_id = u.id
       WHERE re.is_winner = true
       ORDER BY re.won_at DESC
       LIMIT $1`,
      [limit]
    )
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      quarter: row.quarter,
      wonAt: row.won_at,
      prize: row.prize,
      user: {
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name
      }
    }))
  } catch (error) {
    logger.error('Error getting raffle winners:', error)
    throw error
  }
}

/**
 * Start cron job for quarterly raffles
 * Executes on the last day of each quarter at 23:59
 */
export function startRaffleCron() {
  cron.schedule('59 23 31 3,12 *', async () => {
    logger.info('⏰ Ejecutando sorteo trimestral (Q1/Q4)')
    try {
      const result = await executeQuarterlyRaffle()
      if (result.winner) {
        logger.info(`✅ Sorteo completado: ${result.totalEntries} participantes, ganador: ${result.winner}`)
      } else {
        logger.info('✅ Sorteo completado: sin participantes')
      }
    } catch (error) {
      logger.error('❌ Error en sorteo trimestral:', error)
    }
  }, { timezone: 'Europe/Madrid' })
  
  cron.schedule('59 23 30 6,9 *', async () => {
    logger.info('⏰ Ejecutando sorteo trimestral (Q2/Q3)')
    try {
      const result = await executeQuarterlyRaffle()
      if (result.winner) {
        logger.info(`✅ Sorteo completado: ${result.totalEntries} participantes, ganador: ${result.winner}`)
      } else {
        logger.info('✅ Sorteo completado: sin participantes')
      }
    } catch (error) {
      logger.error('❌ Error en sorteo trimestral:', error)
    }
  }, { timezone: 'Europe/Madrid' })
  
  logger.info('✅ Cron job de sorteos trimestrales configurado')
}

export default {
  executeQuarterlyRaffle,
  getRaffleEntries,
  getRaffleWinners,
  startRaffleCron
}
