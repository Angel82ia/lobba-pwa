import { describe, it, expect, beforeEach, vi } from 'vitest';
import pool from '../../src/config/database.js';
import * as MonthlyLimit from '../../src/models/MonthlyLimit.js';
import * as Membership from '../../src/models/Membership.js';

describe('MonthlyLimit Model', () => {
  let testUser;
  let testMembership;

  beforeEach(async () => {
    await pool.query('DELETE FROM monthly_limits');
    await pool.query('DELETE FROM memberships');
    await pool.query('DELETE FROM users WHERE email = $1', ['test@monthlylimit.com']);

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email`,
      ['test@monthlylimit.com', 'hash', 'Test', 'User', 'user']
    );
    testUser = userResult.rows[0];

    testMembership = await Membership.createMembership({
      userId: testUser.id,
      planType: 'essential',
      status: 'active',
    });
  });

  describe('createMonthlyLimits', () => {
    it('should create monthly limits for essential plan', async () => {
      const limits = await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');

      expect(limits).toBeDefined();
      expect(limits.id).toBeDefined();
      expect(limits.membership_id).toBe(testMembership.id);
      expect(limits.emergency_articles).toBe(2);
      expect(limits.powerbanks).toBe(2);
      expect(limits.nail_prints).toBe(100);
      expect(limits.ems_sessions).toBe(0);
      expect(limits.emergency_articles_used).toBe(0);
      expect(limits.powerbanks_used).toBe(0);
    });

    it('should create monthly limits for spirit plan', async () => {
      const limits = await MonthlyLimit.createMonthlyLimits(testMembership.id, 'spirit');

      expect(limits.emergency_articles).toBe(4);
      expect(limits.powerbanks).toBe(4);
      expect(limits.nail_prints).toBe(100);
      expect(limits.ems_sessions).toBe(2);
    });
  });

  describe('getCurrentMonthLimits', () => {
    it('should get monthly limits by membership ID', async () => {
      const created = await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');
      const limits = await MonthlyLimit.getCurrentMonthLimits(testMembership.id);

      expect(limits).toBeDefined();
      expect(limits.id).toBe(created.id);
      expect(limits.membership_id).toBe(testMembership.id);
    });

    it('should return undefined if limits not found', async () => {
      const limits = await MonthlyLimit.getCurrentMonthLimits('00000000-0000-0000-0000-000000000000');

      expect(limits).toBeUndefined();
    });
  });

  describe('getMonthlyLimitsByUserId', () => {
    it('should get monthly limits by user ID with membership info', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');
      const limits = await MonthlyLimit.getMonthlyLimitsByUserId(testUser.id);

      expect(limits).toBeDefined();
      expect(limits.plan_type).toBe('essential');
      expect(limits.membership_status).toBe('active');
      expect(limits.emergency_articles).toBe(2);
    });

    it('should return undefined if user has no active membership', async () => {
      await pool.query(
        `UPDATE memberships SET status = 'expired' WHERE id = $1`,
        [testMembership.id]
      );

      const limits = await MonthlyLimit.getMonthlyLimitsByUserId(testUser.id);

      expect(limits).toBeUndefined();
    });
  });

  describe('incrementUsage', () => {
    it('should increment emergency articles used', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');
      
      const updated = await MonthlyLimit.incrementUsage(testMembership.id, 'emergency_articles_used');

      expect(updated.emergency_articles_used).toBe(1);
    });

    it('should increment powerbanks used', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'spirit');
      
      const updated = await MonthlyLimit.incrementUsage(testMembership.id, 'powerbanks_used');

      expect(updated.powerbanks_used).toBe(1);
    });

    it('should increment nail prints used', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');
      
      const updated = await MonthlyLimit.incrementUsage(testMembership.id, 'nail_prints_used');

      expect(updated.nail_prints_used).toBe(1);
    });
  });

  describe('updateMonthlyLimits', () => {
    it('should update specific fields', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');
      
      const updated = await MonthlyLimit.updateMonthlyLimits(testMembership.id, {
        emergency_articles_used: 2,
        powerbanks_used: 1,
      });

      expect(updated.emergency_articles_used).toBe(2);
      expect(updated.powerbanks_used).toBe(1);
    });
  });

  describe('canUseLimit', () => {
    it('should return true when limit is available', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');
      
      const canUse = await MonthlyLimit.canUseLimit(testMembership.id, 'emergency_articles');

      expect(canUse).toBe(true);
    });

    it('should return false when limit is reached', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');
      
      await MonthlyLimit.incrementUsage(testMembership.id, 'emergency_articles_used');
      await MonthlyLimit.incrementUsage(testMembership.id, 'emergency_articles_used');

      const canUse = await MonthlyLimit.canUseLimit(testMembership.id, 'emergency_articles');

      expect(canUse).toBe(false);
    });

    it('should return false when membership not found', async () => {
      const canUse = await MonthlyLimit.canUseLimit('00000000-0000-0000-0000-000000000000', 'emergency_articles');

      expect(canUse).toBe(false);
    });
  });

  describe('resetMonthlyLimits', () => {
    it('should reset all usage counters', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'spirit');
      
      await MonthlyLimit.incrementUsage(testMembership.id, 'emergency_articles_used');
      await MonthlyLimit.incrementUsage(testMembership.id, 'powerbanks_used');
      await MonthlyLimit.incrementUsage(testMembership.id, 'nail_prints_used');
      await MonthlyLimit.incrementUsage(testMembership.id, 'ems_sessions_used');

      const reset = await MonthlyLimit.resetMonthlyLimits(testMembership.id);

      expect(reset.emergency_articles_used).toBe(0);
      expect(reset.powerbanks_used).toBe(0);
      expect(reset.nail_prints_used).toBe(0);
      expect(reset.ems_sessions_used).toBe(0);
      expect(reset.last_reset_date).toBeDefined();
    });

    it('should update last_reset_date', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');
      
      const before = await MonthlyLimit.getCurrentMonthLimits(testMembership.id);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const reset = await MonthlyLimit.resetMonthlyLimits(testMembership.id);

      expect(new Date(reset.last_reset_date).getTime()).toBeGreaterThan(
        new Date(before.last_reset_date).getTime()
      );
    });
  });
});
