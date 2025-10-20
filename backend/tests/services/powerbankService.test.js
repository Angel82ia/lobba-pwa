import { describe, it, expect, beforeEach } from 'vitest'
import pool from '../../src/config/database.js'
import * as PowerbankService from '../../src/services/powerbankService.js'
import * as PowerbankLoan from '../../src/models/PowerbankLoan.js'
import * as Membership from '../../src/models/Membership.js'
import * as MonthlyLimit from '../../src/models/MonthlyLimit.js'

describe('PowerbankService', () => {
  let testUser
  let testMembership

  beforeEach(async () => {
    await pool.query('DELETE FROM powerbank_loans')
    await pool.query('DELETE FROM monthly_limits')
    await pool.query('DELETE FROM memberships')
    await pool.query('DELETE FROM users WHERE email = $1', ['test@powerbankservice.com'])

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email`,
      ['test@powerbankservice.com', 'hash', 'Test', 'User', 'user']
    )
    testUser = userResult.rows[0]

    testMembership = await Membership.createMembership({
      userId: testUser.id,
      planType: 'essential',
      status: 'active',
    })

    await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential')
  })

  describe('loanPowerbank', () => {
    it('should loan powerbank successfully', async () => {
      const result = await PowerbankService.loanPowerbank(
        testUser.id,
        'PB-001',
        'COM-123',
        'Test Salon'
      )

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.powerbankId).toBe('PB-001')
      expect(result.loanDate).toBeDefined()
      expect(result.deadline).toBeDefined()
      expect(result.commerce.id).toBe('COM-123')
      expect(result.commerce.name).toBe('Test Salon')
    })

    it('should increment monthly limit usage', async () => {
      await PowerbankService.loanPowerbank(testUser.id, 'PB-001', 'COM-123', 'Test Salon')

      const limits = await MonthlyLimit.getCurrentMonthLimits(testMembership.id)

      expect(limits.powerbanks_used).toBe(1)
    })

    it('should fail if user has no membership', async () => {
      await pool.query('DELETE FROM memberships WHERE user_id = $1', [testUser.id])

      await expect(
        PowerbankService.loanPowerbank(testUser.id, 'PB-001', 'COM-123', 'Test Salon')
      ).rejects.toThrow('No active membership')
    })

    it('should fail if monthly limit reached', async () => {
      await MonthlyLimit.incrementUsage(testMembership.id, 'powerbanks_used')
      await MonthlyLimit.incrementUsage(testMembership.id, 'powerbanks_used')

      await expect(
        PowerbankService.loanPowerbank(testUser.id, 'PB-001', 'COM-123', 'Test Salon')
      ).rejects.toThrow('Monthly powerbank loan limit reached')
    })

    it('should fail if user already has active loan', async () => {
      await PowerbankService.loanPowerbank(testUser.id, 'PB-001', 'COM-123', 'Test Salon')

      await expect(
        PowerbankService.loanPowerbank(testUser.id, 'PB-002', 'COM-123', 'Test Salon')
      ).rejects.toThrow('already has an active powerbank loan')
    })
  })

  describe('returnPowerbank', () => {
    it('should return powerbank successfully', async () => {
      const loan = await PowerbankService.loanPowerbank(
        testUser.id,
        'PB-001',
        'COM-123',
        'Test Salon'
      )

      const result = await PowerbankService.returnPowerbank(loan.id, testUser.id)

      expect(result).toBeDefined()
      expect(result.id).toBe(loan.id)
      expect(result.returnDate).toBeDefined()
      expect(result.hoursElapsed).toBeDefined()
      expect(result.penaltyApplied).toBe(false)
    })

    it('should apply penalty if returned after 24h', async () => {
      const loan = await PowerbankService.loanPowerbank(
        testUser.id,
        'PB-001',
        'COM-123',
        'Test Salon'
      )

      await pool.query(
        `UPDATE powerbank_loans SET loan_date = NOW() - INTERVAL '25 hours' WHERE id = $1`,
        [loan.id]
      )

      const result = await PowerbankService.returnPowerbank(loan.id, testUser.id)

      expect(result.penaltyApplied).toBe(true)
      expect(parseFloat(result.penaltyAmount)).toBe(10.0)
      expect(result.penaltyReason).toContain('24 hours')
    })

    it('should fail if loan not found', async () => {
      await expect(
        PowerbankService.returnPowerbank('00000000-0000-0000-0000-000000000000', testUser.id)
      ).rejects.toThrow('Active loan not found')
    })

    it('should fail if loan belongs to different user', async () => {
      const loan = await PowerbankService.loanPowerbank(
        testUser.id,
        'PB-001',
        'COM-123',
        'Test Salon'
      )

      await expect(
        PowerbankService.returnPowerbank(loan.id, '00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Active loan not found')
    })

    it('should fail if loan already returned', async () => {
      const loan = await PowerbankService.loanPowerbank(
        testUser.id,
        'PB-001',
        'COM-123',
        'Test Salon'
      )

      await PowerbankService.returnPowerbank(loan.id, testUser.id)

      await expect(PowerbankService.returnPowerbank(loan.id, testUser.id)).rejects.toThrow(
        'Active loan not found'
      )
    })
  })

  describe('getActiveLoan', () => {
    it('should return active loan with deadline info', async () => {
      const created = await PowerbankService.loanPowerbank(
        testUser.id,
        'PB-001',
        'COM-123',
        'Test Salon'
      )

      const result = await PowerbankService.getActiveLoan(testUser.id)

      expect(result).toBeDefined()
      expect(result.id).toBe(created.id)
      expect(result.powerbankId).toBe('PB-001')
      expect(result.deadline).toBeDefined()
      expect(result.hoursRemaining).toBeDefined()
      expect(result.isOverdue).toBe(false)
      expect(result.commerce.name).toBe('Test Salon')
    })

    it('should return null if no active loan', async () => {
      const result = await PowerbankService.getActiveLoan(testUser.id)

      expect(result).toBeNull()
    })

    it('should mark as overdue if past deadline', async () => {
      const loan = await PowerbankService.loanPowerbank(
        testUser.id,
        'PB-001',
        'COM-123',
        'Test Salon'
      )

      await pool.query(
        `UPDATE powerbank_loans SET loan_date = NOW() - INTERVAL '25 hours' WHERE id = $1`,
        [loan.id]
      )

      const result = await PowerbankService.getActiveLoan(testUser.id)

      expect(result.isOverdue).toBe(true)
      expect(parseFloat(result.hoursRemaining)).toBe(0)
    })
  })

  describe('getLoanHistory', () => {
    it('should return loan history', async () => {
      const loan1 = await PowerbankService.loanPowerbank(
        testUser.id,
        'PB-001',
        'COM-123',
        'Test Salon'
      )
      await PowerbankService.returnPowerbank(loan1.id, testUser.id)

      await PowerbankService.loanPowerbank(testUser.id, 'PB-002', 'COM-123', 'Test Salon')

      const history = await PowerbankService.getLoanHistory(testUser.id)

      expect(history.length).toBe(2)
      expect(history[0].powerbankId).toBe('PB-002')
      expect(history[1].powerbankId).toBe('PB-001')
    })

    it('should respect limit parameter', async () => {
      for (let i = 1; i <= 5; i++) {
        const loan = await PowerbankService.loanPowerbank(
          testUser.id,
          `PB-00${i}`,
          'COM-123',
          'Test Salon'
        )
        await PowerbankService.returnPowerbank(loan.id, testUser.id)
        await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential')
      }

      const history = await PowerbankService.getLoanHistory(testUser.id, 3)

      expect(history.length).toBe(3)
    })

    it('should include penalty information', async () => {
      const loan = await PowerbankService.loanPowerbank(
        testUser.id,
        'PB-001',
        'COM-123',
        'Test Salon'
      )

      await pool.query(
        `UPDATE powerbank_loans SET loan_date = NOW() - INTERVAL '25 hours' WHERE id = $1`,
        [loan.id]
      )
      await PowerbankService.returnPowerbank(loan.id, testUser.id)

      const history = await PowerbankService.getLoanHistory(testUser.id)

      expect(history[0].penaltyApplied).toBe(true)
      expect(parseFloat(history[0].penaltyAmount)).toBe(10.0)
    })
  })

  describe('checkOverdueLoans', () => {
    it('should mark overdue loans', async () => {
      const loan = await PowerbankService.loanPowerbank(
        testUser.id,
        'PB-001',
        'COM-123',
        'Test Salon'
      )

      await pool.query(
        `UPDATE powerbank_loans SET loan_date = NOW() - INTERVAL '25 hours' WHERE id = $1`,
        [loan.id]
      )

      const count = await PowerbankService.checkOverdueLoans()

      expect(count).toBe(1)

      const updated = await PowerbankLoan.findLoanById(loan.id)
      expect(updated.status).toBe('overdue')
    })

    it('should return 0 if no overdue loans', async () => {
      await PowerbankService.loanPowerbank(testUser.id, 'PB-001', 'COM-123', 'Test Salon')

      const count = await PowerbankService.checkOverdueLoans()

      expect(count).toBe(0)
    })

    it('should not mark returned loans as overdue', async () => {
      const loan = await PowerbankService.loanPowerbank(
        testUser.id,
        'PB-001',
        'COM-123',
        'Test Salon'
      )

      await pool.query(
        `UPDATE powerbank_loans SET loan_date = NOW() - INTERVAL '25 hours' WHERE id = $1`,
        [loan.id]
      )

      await PowerbankService.returnPowerbank(loan.id, testUser.id)

      const count = await PowerbankService.checkOverdueLoans()

      expect(count).toBe(0)
    })
  })
})
