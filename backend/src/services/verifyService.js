/**
 * Verify Service - Twilio Verify API
 * 
 * Verificación de usuarios multi-canal:
 * - OTP (One-Time Password) vía SMS, WhatsApp, Email
 * - 2FA (Two-Factor Authentication)
 * - Verificación de teléfono en registro
 * - Recuperación de cuenta segura
 */

import twilio from 'twilio';
import logger from '../utils/logger.js';

class VerifyService {
  constructor() {
    this.client = null;
    this.serviceSid = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      this.serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

      if (!accountSid || !authToken) {
        logger.warn('⚠️  Twilio credentials not configured - verify service disabled');
        this.initialized = false;
        return false;
      }

      this.client = twilio(accountSid, authToken);

      if (!this.serviceSid) {
        logger.warn('⚠️  Twilio Verify Service SID not configured');
        logger.info('Creating Verify Service programmatically...');
        
        try {
          const service = await this.client.verify.v2.services.create({
            friendlyName: 'LOBBA PWA Verification',
          });
          this.serviceSid = service.sid;
          logger.info(`✅ Verify Service created: ${this.serviceSid}`);
          logger.warn(`⚠️  Add to .env: TWILIO_VERIFY_SERVICE_SID=${this.serviceSid}`);
        } catch (createError) {
          logger.error('Failed to create Verify Service:', createError.message);
          this.initialized = false;
          return false;
        }
      }

      await this.client.verify.v2.services(this.serviceSid).fetch();
      
      this.initialized = true;
      logger.info('✅ Verify Service initialized');
      return true;
    } catch (error) {
      logger.error('❌ Verify Service initialization failed:', error.message);
      this.initialized = false;
      return false;
    }
  }

  isInitialized() {
    return this.initialized;
  }

  isConfigured() {
    return !!process.env.TWILIO_ACCOUNT_SID && 
           !!process.env.TWILIO_AUTH_TOKEN && 
           !!process.env.TWILIO_VERIFY_SERVICE_SID;
  }

  async sendVerificationCode(phoneOrEmail, channel = 'sms', options = {}) {
    if (!this.isInitialized()) {
      logger.warn('Verify service not initialized - skipping verification code');
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const verification = await this.client.verify.v2
        .services(this.serviceSid)
        .verifications
        .create({
          to: phoneOrEmail,
          channel, 
          locale: options.locale || 'es',
          customFriendlyName: options.friendlyName || 'LOBBA',
          ...(options.codeLength && { codeLength: options.codeLength }),
        });

      logger.info(`Verification code sent via ${channel} to ${phoneOrEmail}: ${verification.status}`);

      return {
        success: true,
        status: verification.status, 
        to: phoneOrEmail,
        channel,
      };
    } catch (error) {
      logger.error(`Error sending verification code to ${phoneOrEmail}:`, error.message);
      
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async checkVerificationCode(phoneOrEmail, code) {
    if (!this.isInitialized()) {
      logger.warn('Verify service not initialized - skipping verification check');
      return { success: false, valid: false, error: 'Service not initialized' };
    }

    try {
      const verificationCheck = await this.client.verify.v2
        .services(this.serviceSid)
        .verificationChecks
        .create({
          to: phoneOrEmail,
          code: code.toString(),
        });

      const isValid = verificationCheck.status === 'approved';

      logger.info(`Verification check for ${phoneOrEmail}: ${verificationCheck.status}`);

      return {
        success: true,
        valid: isValid,
        status: verificationCheck.status,
        to: phoneOrEmail,
      };
    } catch (error) {
      logger.error(`Error checking verification code for ${phoneOrEmail}:`, error.message);

      return {
        success: false,
        valid: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async sendPhoneVerification(phone) {
    return await this.sendVerificationCode(phone, 'sms', {
      codeLength: 6,
      locale: 'es',
    });
  }

  async sendWhatsAppVerification(phone) {
    return await this.sendVerificationCode(`whatsapp:${phone}`, 'whatsapp', {
      codeLength: 6,
      locale: 'es',
    });
  }

  async sendEmailVerification(email) {
    return await this.sendVerificationCode(email, 'email', {
      codeLength: 6,
      locale: 'es',
    });
  }

  async verifyPhone(phone, code) {
    return await this.checkVerificationCode(phone, code);
  }

  async verifyWhatsApp(phone, code) {
    return await this.checkVerificationCode(`whatsapp:${phone}`, code);
  }

  async verifyEmail(email, code) {
    return await this.checkVerificationCode(email, code);
  }

  async sendVerificationWithFallback(phone, email) {
    try {
      const smsResult = await this.sendPhoneVerification(phone);
      
      if (smsResult.success) {
        return {
          success: true,
          channel: 'sms',
          to: phone,
        };
      }

      logger.warn('SMS verification failed, trying WhatsApp...');
      const whatsappResult = await this.sendWhatsAppVerification(phone);
      
      if (whatsappResult.success) {
        return {
          success: true,
          channel: 'whatsapp',
          to: phone,
        };
      }

      if (email) {
        logger.warn('WhatsApp verification failed, trying email...');
        const emailResult = await this.sendEmailVerification(email);
        
        if (emailResult.success) {
          return {
            success: true,
            channel: 'email',
            to: email,
          };
        }
      }

      return {
        success: false,
        error: 'All verification channels failed',
      };
    } catch (error) {
      logger.error('Verification with fallback failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async configureRateLimits() {
    if (!this.isInitialized()) {
      return false;
    }

    try {
      const rateLimit = await this.client.verify.v2
        .services(this.serviceSid)
        .rateLimits
        .create({
          uniqueName: 'verification_attempts',
          description: 'Máximo 5 intentos por hora por número',
        });

      await this.client.verify.v2
        .services(this.serviceSid)
        .rateLimits(rateLimit.sid)
        .buckets
        .create({
          max: 5,
          interval: 3600,
        });

      logger.info('✅ Verify Service rate limits configured');
      return true;
    } catch (error) {
      logger.error('Error configuring rate limits:', error.message);
      return false;
    }
  }
}

export { VerifyService };

const verifyService = new VerifyService();
export default verifyService;
