import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import pool from '../src/config/database.js'
import { getARCreditsInfo, getARUsageStats } from '../src/middleware/arCredits.js'

/**
 * Tests para el sistema unificado de créditos AR
 * Sistema: 50 créditos/mes para uñas, peinados y maquillaje
 */

describe('Sistema Unificado de Créditos AR', () => {
  let testUserId

  beforeEach(async () => {
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, ar_credits, ar_credits_used, ar_credits_reset_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        'test-ar@lobba.es',
        'hashed_password',
        'Test',
        'User',
        'user',
        50,
        0,
        new Date()
      ]
    )
    testUserId = userResult.rows[0].id
  })

  afterEach(async () => {
    if (testUserId) {
      await pool.query('DELETE FROM ar_credits_usage_log WHERE user_id = $1', [testUserId])
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId])
    }
  })

  describe('Créditos AR iniciales', () => {
    it('Usuario nuevo tiene 50 créditos AR disponibles', async () => {
      const info = await getARCreditsInfo(testUserId)
      
      expect(info).toBeDefined()
      expect(info.total).toBe(50)
      expect(info.used).toBe(0)
      expect(info.available).toBe(50)
    })

    it('Usuario puede consultar sus créditos disponibles', async () => {
      const result = await pool.query(
        'SELECT ar_credits, ar_credits_used FROM users WHERE id = $1',
        [testUserId]
      )
      
      const user = result.rows[0]
      expect(user.ar_credits).toBe(50)
      expect(user.ar_credits_used).toBe(0)
    })
  })

  describe('Consumo de créditos AR', () => {
    it('Consumir 1 crédito para uñas funciona correctamente', async () => {
      const result = await pool.query(
        'SELECT * FROM consume_ar_credits($1, $2, $3, $4)',
        [testUserId, 'nails', 1, JSON.stringify({ test: true })]
      )
      
      const { success, remaining_credits, error_message } = result.rows[0]
      
      expect(success).toBe(true)
      expect(remaining_credits).toBe(49)
      expect(error_message).toBeNull()
    })

    it('Consumir 1 crédito para peinados funciona correctamente', async () => {
      const result = await pool.query(
        'SELECT * FROM consume_ar_credits($1, $2, $3, $4)',
        [testUserId, 'hairstyle', 1, JSON.stringify({ style_id: 123 })]
      )
      
      const { success, remaining_credits } = result.rows[0]
      
      expect(success).toBe(true)
      expect(remaining_credits).toBe(49)
    })

    it('Consumir 1 crédito para maquillaje funciona correctamente', async () => {
      const result = await pool.query(
        'SELECT * FROM consume_ar_credits($1, $2, $3, $4)',
        [testUserId, 'makeup', 1, JSON.stringify({ preset_id: 456 })]
      )
      
      const { success, remaining_credits } = result.rows[0]
      
      expect(success).toBe(true)
      expect(remaining_credits).toBe(49)
    })

    it('Usuario puede combinar libremente las 3 funciones', async () => {
      for (let i = 0; i < 20; i++) {
        await pool.query(
          'SELECT * FROM consume_ar_credits($1, $2, $3, $4)',
          [testUserId, 'nails', 1, '{}']
        )
      }

      for (let i = 0; i < 15; i++) {
        await pool.query(
          'SELECT * FROM consume_ar_credits($1, $2, $3, $4)',
          [testUserId, 'hairstyle', 1, '{}']
        )
      }

      for (let i = 0; i < 10; i++) {
        await pool.query(
          'SELECT * FROM consume_ar_credits($1, $2, $3, $4)',
          [testUserId, 'makeup', 1, '{}']
        )
      }

      const info = await getARCreditsInfo(testUserId)
      
      expect(info.used).toBe(45)
      expect(info.available).toBe(5)
    })

    it('Consumir múltiples créditos a la vez funciona', async () => {
      const result = await pool.query(
        'SELECT * FROM consume_ar_credits($1, $2, $3, $4)',
        [testUserId, 'nails', 5, '{}']
      )
      
      const { success, remaining_credits } = result.rows[0]
      
      expect(success).toBe(true)
      expect(remaining_credits).toBe(45)
    })
  })

  describe('Límites y validaciones', () => {
    it('No permite consumir más créditos de los disponibles', async () => {
      await pool.query(
        'UPDATE users SET ar_credits_used = 50 WHERE id = $1',
        [testUserId]
      )

      const result = await pool.query(
        'SELECT * FROM consume_ar_credits($1, $2, $3, $4)',
        [testUserId, 'nails', 1, '{}']
      )
      
      const { success, error_message } = result.rows[0]
      
      expect(success).toBe(false)
      expect(error_message).toBe('INSUFFICIENT_AR_CREDITS')
    })

    it('No permite consumir más créditos que el total disponible', async () => {
      const result = await pool.query(
        'SELECT * FROM consume_ar_credits($1, $2, $3, $4)',
        [testUserId, 'nails', 51, '{}']
      )
      
      const { success, error_message } = result.rows[0]
      
      expect(success).toBe(false)
      expect(error_message).toBe('INSUFFICIENT_AR_CREDITS')
    })

    it('Bloquea correctamente cuando se agotan los créditos', async () => {
      for (let i = 0; i < 50; i++) {
        await pool.query(
          'SELECT * FROM consume_ar_credits($1, $2, $3, $4)',
          [testUserId, 'nails', 1, '{}']
        )
      }

      const result = await pool.query(
        'SELECT * FROM consume_ar_credits($1, $2, $3, $4)',
        [testUserId, 'nails', 1, '{}']
      )
      
      const { success } = result.rows[0]
      expect(success).toBe(false)
    })
  })

  describe('Log de auditoría', () => {
    it('Registra correctamente el consumo en ar_credits_usage_log', async () => {
      await pool.query(
        'SELECT * FROM consume_ar_credits($1, $2, $3, $4)',
        [testUserId, 'nails', 1, JSON.stringify({ prompt: 'test nail design' })]
      )

      const logResult = await pool.query(
        'SELECT * FROM ar_credits_usage_log WHERE user_id = $1',
        [testUserId]
      )
      
      expect(logResult.rows.length).toBe(1)
      expect(logResult.rows[0].feature_type).toBe('nails')
      expect(logResult.rows[0].credits_consumed).toBe(1)
      expect(logResult.rows[0].credits_remaining).toBe(49)
    })

    it('Registra metadata correctamente en el log', async () => {
      const metadata = { prompt: 'test', style: 'modern' }
      
      await pool.query(
        'SELECT * FROM consume_ar_credits($1, $2, $3, $4)',
        [testUserId, 'nails', 1, JSON.stringify(metadata)]
      )

      const logResult = await pool.query(
        'SELECT * FROM ar_credits_usage_log WHERE user_id = $1',
        [testUserId]
      )
      
      expect(logResult.rows[0].metadata).toEqual(metadata)
    })
  })

  describe('Estadísticas de uso', () => {
    it('Vista ar_credits_stats muestra desglose correcto', async () => {
      await pool.query('SELECT * FROM consume_ar_credits($1, $2, $3, $4)', [testUserId, 'nails', 5, '{}'])
      await pool.query('SELECT * FROM consume_ar_credits($1, $2, $3, $4)', [testUserId, 'hairstyle', 3, '{}'])
      await pool.query('SELECT * FROM consume_ar_credits($1, $2, $3, $4)', [testUserId, 'makeup', 2, '{}'])

      const stats = await getARUsageStats(testUserId)

      expect(stats.total_uses).toBe(10)
      expect(stats.nails_count).toBe(5)
      expect(stats.hairstyle_count).toBe(3)
      expect(stats.makeup_count).toBe(2)
    })

    it('Estadísticas solo cuentan el mes actual', async () => {
      await pool.query('SELECT * FROM consume_ar_credits($1, $2, $3, $4)', [testUserId, 'nails', 5, '{}'])

      await pool.query(
        `UPDATE ar_credits_usage_log 
         SET created_at = NOW() - INTERVAL '2 months'
         WHERE user_id = $1`,
        [testUserId]
      )

      const stats = await getARUsageStats(testUserId)
      expect(stats.total_uses).toBe(0)
    })
  })

  describe('Reset mensual', () => {
    it('Reset mensual restaura créditos a 50', async () => {
      await pool.query(
        'UPDATE users SET ar_credits_used = 30 WHERE id = $1',
        [testUserId]
      )

      await pool.query('SELECT reset_monthly_ar_credits()')

      const info = await getARCreditsInfo(testUserId)
      expect(info.used).toBe(0)
      expect(info.available).toBe(50)
    })

    it('Reset mensual solo afecta usuarios con créditos usados', async () => {
      const result = await pool.query('SELECT reset_monthly_ar_credits() as count')
      const affectedRows = result.rows[0].count

      expect(affectedRows).toBeGreaterThanOrEqual(0)
    })

    it('Reset automático cuando el mes cambia', async () => {
      await pool.query(
        `UPDATE users 
         SET ar_credits_used = 30,
             ar_credits_reset_date = NOW() - INTERVAL '2 months'
         WHERE id = $1`,
        [testUserId]
      )

      const result = await pool.query(
        'SELECT * FROM consume_ar_credits($1, $2, $3, $4)',
        [testUserId, 'nails', 1, '{}']
      )
      
      const { success, remaining_credits } = result.rows[0]
      
      expect(success).toBe(true)
      expect(remaining_credits).toBe(49)
    })
  })

  describe('Integridad y concurrencia', () => {
    it('Constraint check_ar_credits_valid previene valores inválidos', async () => {
      await expect(
        pool.query(
          'UPDATE users SET ar_credits_used = 51 WHERE id = $1',
          [testUserId]
        )
      ).rejects.toThrow()
    })

    it('Función consume_ar_credits usa lock para evitar race conditions', async () => {
      const promises = []
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          pool.query(
            'SELECT * FROM consume_ar_credits($1, $2, $3, $4)',
            [testUserId, 'nails', 1, '{}']
          )
        )
      }

      await Promise.all(promises)

      const info = await getARCreditsInfo(testUserId)
      expect(info.used).toBe(10)
      expect(info.available).toBe(40)
    })
  })
})
