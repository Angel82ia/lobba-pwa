import { describe, it, expect, beforeEach } from 'vitest';
import pool from '../../src/config/database.js';
import * as PowerbankLoan from '../../src/models/PowerbankLoan.js';

describe('PowerbankLoan Model', () => {
  let testUser;

  beforeEach(async () => {
    await pool.query('DELETE FROM powerbank_loans');
    await pool.query('DELETE FROM users WHERE email = $1', ['test@powerbank.com']);

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email`,
      ['test@powerbank.com', 'hash', 'Test', 'User', 'user']
    );
    testUser = userResult.rows[0];
  });

  describe('createLoan', () => {
    it('should create a powerbank loan', async () => {
      const loan = await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-001',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      expect(loan).toBeDefined();
      expect(loan.id).toBeDefined();
      expect(loan.user_id).toBe(testUser.id);
      expect(loan.powerbank_id).toBe('PB-001');
      expect(loan.status).toBe('active');
      expect(loan.commerce_id).toBe('COM-123');
      expect(loan.commerce_name).toBe('Test Salon');
    });
  });

  describe('findActiveLoanByUserId', () => {
    it('should find active loan', async () => {
      const created = await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-001',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      const found = await PowerbankLoan.findActiveLoanByUserId(testUser.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
      expect(found.status).toBe('active');
    });

    it('should return null if no active loan', async () => {
      const found = await PowerbankLoan.findActiveLoanByUserId(testUser.id);

      expect(found).toBeNull();
    });

    it('should not return returned loans', async () => {
      const loan = await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-001',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      await PowerbankLoan.markAsReturned(loan.id);

      const found = await PowerbankLoan.findActiveLoanByUserId(testUser.id);

      expect(found).toBeNull();
    });
  });

  describe('findLoanById', () => {
    it('should find loan by id', async () => {
      const created = await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-001',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      const found = await PowerbankLoan.findLoanById(created.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
    });
  });

  describe('findLoanByIdAndUserId', () => {
    it('should find loan by id and user id', async () => {
      const created = await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-001',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      const found = await PowerbankLoan.findLoanByIdAndUserId(created.id, testUser.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
    });

    it('should return null for wrong user', async () => {
      const created = await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-001',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      const found = await PowerbankLoan.findLoanByIdAndUserId(created.id, '00000000-0000-0000-0000-000000000000');

      expect(found).toBeNull();
    });
  });

  describe('markAsReturned', () => {
    it('should mark loan as returned with no penalty if within 24h', async () => {
      const loan = await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-001',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      const returned = await PowerbankLoan.markAsReturned(loan.id);

      expect(returned.status).toBe('returned');
      expect(returned.return_date).toBeDefined();
      expect(returned.hours_elapsed).toBeLessThan(1);
      expect(returned.penalty_applied).toBe(false);
    });

    it('should apply €10 penalty if returned after 24h', async () => {
      const loan = await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-001',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      await pool.query(
        `UPDATE powerbank_loans SET loan_date = NOW() - INTERVAL '25 hours' WHERE id = $1`,
        [loan.id]
      );

      const returned = await PowerbankLoan.markAsReturned(loan.id);

      expect(returned.status).toBe('returned');
      expect(returned.penalty_applied).toBe(true);
      expect(parseFloat(returned.penalty_amount)).toBe(10.00);
      expect(returned.penalty_reason).toContain('24 hours');
    });
  });

  describe('findLoansByUserId', () => {
    it('should return loan history', async () => {
      await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-001',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-002',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      const history = await PowerbankLoan.findLoansByUserId(testUser.id);

      expect(history.length).toBe(2);
    });

    it('should respect limit', async () => {
      for (let i = 1; i <= 5; i++) {
        await PowerbankLoan.createLoan({
          userId: testUser.id,
          powerbankId: `PB-00${i}`,
          commerceId: 'COM-123',
          commerceName: 'Test Salon',
        });
      }

      const history = await PowerbankLoan.findLoansByUserId(testUser.id, 3);

      expect(history.length).toBe(3);
    });
  });

  describe('findOverdueLoans', () => {
    it('should find loans older than 24h', async () => {
      const loan = await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-001',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      await pool.query(
        `UPDATE powerbank_loans SET loan_date = NOW() - INTERVAL '25 hours' WHERE id = $1`,
        [loan.id]
      );

      const overdue = await PowerbankLoan.findOverdueLoans();

      expect(overdue.length).toBe(1);
      expect(overdue[0].id).toBe(loan.id);
    });

    it('should not return recent loans', async () => {
      await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-001',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      const overdue = await PowerbankLoan.findOverdueLoans();

      expect(overdue.length).toBe(0);
    });
  });

  describe('markAsOverdue', () => {
    it('should change status to overdue', async () => {
      const loan = await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-001',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      const updated = await PowerbankLoan.markAsOverdue(loan.id);

      expect(updated.status).toBe('overdue');
    });
  });

  describe('markAsLost', () => {
    it('should mark as lost with penalty', async () => {
      const loan = await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-001',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      const updated = await PowerbankLoan.markAsLost(loan.id, 50.00, 'Powerbank not returned after 7 days');

      expect(updated.status).toBe('lost');
      expect(updated.penalty_applied).toBe(true);
      expect(parseFloat(updated.penalty_amount)).toBe(50.00);
      expect(updated.penalty_reason).toBe('Powerbank not returned after 7 days');
    });
  });

  describe('countActiveLoans', () => {
    it('should count active loans', async () => {
      await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-001',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      const count = await PowerbankLoan.countActiveLoans(testUser.id);

      expect(count).toBe(1);
    });

    it('should return 0 if no active loans', async () => {
      const count = await PowerbankLoan.countActiveLoans(testUser.id);

      expect(count).toBe(0);
    });

    it('should not count returned loans', async () => {
      const loan = await PowerbankLoan.createLoan({
        userId: testUser.id,
        powerbankId: 'PB-001',
        commerceId: 'COM-123',
        commerceName: 'Test Salon',
      });

      await PowerbankLoan.markAsReturned(loan.id);

      const count = await PowerbankLoan.countActiveLoans(testUser.id);

      expect(count).toBe(0);
    });
  });
});
