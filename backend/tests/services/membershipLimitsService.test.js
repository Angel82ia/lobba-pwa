import { describe, it, expect, beforeEach, vi } from 'vitest';
import pool from '../../src/config/database.js';
import * as MembershipLimitsService from '../../src/services/membershipLimitsService.js';
import * as MonthlyLimit from '../../src/models/MonthlyLimit.js';
import * as Membership from '../../src/models/Membership.js';

describe('MembershipLimitsService', () => {
  let testUser;
  let testMembership;

  beforeEach(async () => {
    await pool.query('DELETE FROM powerbank_loans');
    await pool.query('DELETE FROM monthly_limits');
    await pool.query('DELETE FROM memberships');
    await pool.query('DELETE FROM users WHERE email = $1', ['test@limitsservice.com']);

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email`,
      ['test@limitsservice.com', 'hash', 'Test', 'User', 'user']
    );
    testUser = userResult.rows[0];

    testMembership = await Membership.createMembership({
      userId: testUser.id,
      planType: 'essential',
      status: 'active',
    });
  });

  describe('getCurrentMonthLimits', () => {
    it('should return no membership when user has no active membership', async () => {
      await pool.query('DELETE FROM memberships WHERE user_id = $1', [testUser.id]);

      const limits = await MembershipLimitsService.getCurrentMonthLimits(testUser.id);

      expect(limits.hasMembership).toBe(false);
      expect(limits.emergencies.limit).toBe(0);
      expect(limits.powerbanks.limit).toBe(0);
    });

    it('should return essential plan limits', async () => {
      const limits = await MembershipLimitsService.getCurrentMonthLimits(testUser.id);

      expect(limits.hasMembership).toBe(true);
      expect(limits.membershipType).toBe('essential');
      expect(limits.emergencies.limit).toBe(2);
      expect(limits.emergencies.used).toBe(0);
      expect(limits.emergencies.remaining).toBe(2);
      expect(limits.powerbanks.limit).toBe(2);
      expect(limits.nailPrints.limit).toBe(100);
      expect(limits.emsSessions.limit).toBe(0);
    });

    it('should return spirit plan limits', async () => {
      await pool.query(
        `UPDATE memberships SET plan_type = 'spirit' WHERE id = $1`,
        [testMembership.id]
      );

      const limits = await MembershipLimitsService.getCurrentMonthLimits(testUser.id);

      expect(limits.membershipType).toBe('spirit');
      expect(limits.emergencies.limit).toBe(4);
      expect(limits.powerbanks.limit).toBe(4);
      expect(limits.emsSessions.limit).toBe(2);
    });

    it('should create monthly_limits if not exists', async () => {
      const limits = await MembershipLimitsService.getCurrentMonthLimits(testUser.id);

      expect(limits.hasMembership).toBe(true);
      
      const monthlyLimits = await MonthlyLimit.getCurrentMonthLimits(testMembership.id);
      expect(monthlyLimits).toBeDefined();
      expect(monthlyLimits.emergency_articles).toBe(2);
    });

    it('should show correct usage after using emergency', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');
      await MonthlyLimit.incrementUsage(testMembership.id, 'emergency_articles_used');

      const limits = await MembershipLimitsService.getCurrentMonthLimits(testUser.id);

      expect(limits.emergencies.used).toBe(1);
      expect(limits.emergencies.remaining).toBe(1);
    });
  });

  describe('canUseEmergency', () => {
    it('should allow emergency use when limit available', async () => {
      const result = await MembershipLimitsService.canUseEmergency(testUser.id);

      expect(result.canUse).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should deny when no membership', async () => {
      await pool.query('DELETE FROM memberships WHERE user_id = $1', [testUser.id]);

      const result = await MembershipLimitsService.canUseEmergency(testUser.id);

      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('No active membership');
    });

    it('should deny when limit reached', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');
      await MonthlyLimit.incrementUsage(testMembership.id, 'emergency_articles_used');
      await MonthlyLimit.incrementUsage(testMembership.id, 'emergency_articles_used');

      const result = await MembershipLimitsService.canUseEmergency(testUser.id);

      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('limit reached');
    });
  });

  describe('canLoanPowerbank', () => {
    it('should allow powerbank loan when limit available', async () => {
      const result = await MembershipLimitsService.canLoanPowerbank(testUser.id);

      expect(result.canUse).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should deny when no membership', async () => {
      await pool.query('DELETE FROM memberships WHERE user_id = $1', [testUser.id]);

      const result = await MembershipLimitsService.canLoanPowerbank(testUser.id);

      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('No active membership');
    });

    it('should deny when monthly limit reached', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');
      await MonthlyLimit.incrementUsage(testMembership.id, 'powerbanks_used');
      await MonthlyLimit.incrementUsage(testMembership.id, 'powerbanks_used');

      const result = await MembershipLimitsService.canLoanPowerbank(testUser.id);

      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('Monthly powerbank loan limit reached');
    });

    it('should deny when user has active loan', async () => {
      await pool.query(
        `INSERT INTO powerbank_loans (user_id, device_id, status, loaned_at)
         VALUES ($1, $2, 'active', CURRENT_TIMESTAMP)`,
        [testUser.id, '00000000-0000-0000-0000-000000000001']
      );

      const result = await MembershipLimitsService.canLoanPowerbank(testUser.id);

      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('already have an active');
    });
  });

  describe('canUseNailPrint', () => {
    it('should allow nail print when limit available', async () => {
      const result = await MembershipLimitsService.canUseNailPrint(testUser.id);

      expect(result.canUse).toBe(true);
      expect(result.remaining).toBe(100);
    });

    it('should deny when limit reached', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');
      await pool.query(
        `UPDATE monthly_limits SET nail_prints_used = 100 WHERE membership_id = $1`,
        [testMembership.id]
      );

      const result = await MembershipLimitsService.canUseNailPrint(testUser.id);

      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('nail print limit reached');
    });
  });

  describe('canUseEMS', () => {
    it('should deny EMS for essential plan', async () => {
      const result = await MembershipLimitsService.canUseEMS(testUser.id);

      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('Spirit membership');
    });

    it('should allow EMS for spirit plan', async () => {
      await pool.query(
        `UPDATE memberships SET plan_type = 'spirit' WHERE id = $1`,
        [testMembership.id]
      );

      const result = await MembershipLimitsService.canUseEMS(testUser.id);

      expect(result.canUse).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should deny when spirit limit reached', async () => {
      await pool.query(
        `UPDATE memberships SET plan_type = 'spirit' WHERE id = $1`,
        [testMembership.id]
      );
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'spirit');
      await MonthlyLimit.incrementUsage(testMembership.id, 'ems_sessions_used');
      await MonthlyLimit.incrementUsage(testMembership.id, 'ems_sessions_used');

      const result = await MembershipLimitsService.canUseEMS(testUser.id);

      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('limit reached');
    });
  });

  describe('recordEmergencyUse', () => {
    it('should increment emergency usage', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');

      const result = await MembershipLimitsService.recordEmergencyUse(testUser.id);

      expect(result.emergency_articles_used).toBe(1);
    });

    it('should throw when no active membership', async () => {
      await pool.query('DELETE FROM memberships WHERE user_id = $1', [testUser.id]);

      await expect(
        MembershipLimitsService.recordEmergencyUse(testUser.id)
      ).rejects.toThrow('No active membership');
    });
  });

  describe('recordPowerbankLoan', () => {
    it('should increment powerbank usage', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');

      const result = await MembershipLimitsService.recordPowerbankLoan(testUser.id);

      expect(result.powerbanks_used).toBe(1);
    });
  });

  describe('recordNailPrintUse', () => {
    it('should increment nail print usage', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');

      const result = await MembershipLimitsService.recordNailPrintUse(testUser.id);

      expect(result.nail_prints_used).toBe(1);
    });
  });

  describe('recordEMSSession', () => {
    it('should increment EMS session usage', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'spirit');

      const result = await MembershipLimitsService.recordEMSSession(testUser.id);

      expect(result.ems_sessions_used).toBe(1);
    });
  });

  describe('getMembershipLimits', () => {
    it('should return essential limits', () => {
      const limits = MembershipLimitsService.getMembershipLimits('essential');

      expect(limits.emergencyArticles).toBe(2);
      expect(limits.powerbanks).toBe(2);
      expect(limits.emsSessions).toBe(0);
    });

    it('should return spirit limits', () => {
      const limits = MembershipLimitsService.getMembershipLimits('spirit');

      expect(limits.emergencyArticles).toBe(4);
      expect(limits.powerbanks).toBe(4);
      expect(limits.emsSessions).toBe(2);
    });

    it('should return null for invalid type', () => {
      const limits = MembershipLimitsService.getMembershipLimits('invalid');

      expect(limits).toBeNull();
    });
  });

  describe('resetUserMonthlyLimits', () => {
    it('should reset all counters to zero', async () => {
      await MonthlyLimit.createMonthlyLimits(testMembership.id, 'essential');
      await MonthlyLimit.incrementUsage(testMembership.id, 'emergency_articles_used');
      await MonthlyLimit.incrementUsage(testMembership.id, 'powerbanks_used');

      const result = await MembershipLimitsService.resetUserMonthlyLimits(testUser.id);

      expect(result.emergency_articles_used).toBe(0);
      expect(result.powerbanks_used).toBe(0);
      expect(result.nail_prints_used).toBe(0);
      expect(result.ems_sessions_used).toBe(0);
    });

    it('should throw when no active membership', async () => {
      await pool.query('DELETE FROM memberships WHERE user_id = $1', [testUser.id]);

      await expect(
        MembershipLimitsService.resetUserMonthlyLimits(testUser.id)
      ).rejects.toThrow('No active membership');
    });
  });
});
