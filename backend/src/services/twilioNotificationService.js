/**
 * Twilio Notification Service - Sistema Centralizado LOBBA
 * 
 * IMPORTANTE: Este servicio NO reemplaza el sistema de click-to-chat actual.
 * Solo maneja notificaciones ONE-WAY desde el número central de LOBBA.
 * 
 * Modelo Híbrido:
 * - VÍA 1: Click-to-chat (cada salón su número) - backend/src/utils/whatsapp.js
 * - VÍA 2: Notificaciones centralizadas (este servicio) - número LOBBA +34614392922
 */

import twilio from 'twilio';
import pool from '../config/database.js';
import logger from '../utils/logger.js';

class TwilioNotificationService {
  constructor() {
    this.client = null;
    this.whatsappNumber = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

      if (!accountSid || !authToken || !this.whatsappNumber) {
        logger.warn('⚠️  Twilio credentials not configured - notification service disabled');
        this.initialized = false;
        return false;
      }

      this.client = twilio(accountSid, authToken);
      
      await this.client.api.accounts(accountSid).fetch();
      
      this.initialized = true;
      logger.info('✅ Twilio Notification Service initialized');
      return true;
    } catch (error) {
      logger.error('❌ Twilio initialization failed:', error.message);
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
           !!process.env.TWILIO_WHATSAPP_FROM;
  }

  async sendAppointmentConfirmation(appointment) {
    if (!this.isInitialized()) {
      logger.warn('Twilio not initialized - skipping appointment confirmation');
      return null;
    }

    try {
      const messageBody = this.templates.appointmentConfirmation({
        salonName: appointment.salon?.name || 'LOBBA',
        clientName: appointment.client_name,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        service: appointment.service_type || 'servicio',
      });

      const message = await this.client.messages.create({
        from: `whatsapp:${this.whatsappNumber}`,
        to: `whatsapp:${appointment.client_phone}`,
        body: messageBody,
      });

      await this.saveNotification({
        type: 'appointment_confirmation',
        appointment_id: appointment.id,
        to: appointment.client_phone,
        message_sid: message.sid,
        status: message.status,
        content: messageBody,
      });

      logger.info(`WhatsApp confirmation sent: ${message.sid}`);
      return message;
    } catch (error) {
      logger.error('Error sending appointment confirmation:', error);
      return null;
    }
  }

  async sendAppointmentReminder(appointment) {
    if (!this.isInitialized()) {
      logger.warn('Twilio not initialized - skipping appointment reminder');
      return null;
    }

    try {
      const messageBody = this.templates.appointmentReminder({
        salonName: appointment.salon?.name || 'LOBBA',
        clientName: appointment.client_name,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        service: appointment.service_type || 'servicio',
      });

      const message = await this.client.messages.create({
        from: `whatsapp:${this.whatsappNumber}`,
        to: `whatsapp:${appointment.client_phone}`,
        body: messageBody,
      });

      await this.saveNotification({
        type: 'appointment_reminder',
        appointment_id: appointment.id,
        to: appointment.client_phone,
        message_sid: message.sid,
        status: message.status,
        content: messageBody,
      });

      logger.info(`WhatsApp reminder sent: ${message.sid}`);
      return message;
    } catch (error) {
      logger.error('Error sending appointment reminder:', error);
      return null;
    }
  }

  async sendCancellationNotice(appointment) {
    if (!this.isInitialized()) {
      logger.warn('Twilio not initialized - skipping cancellation notice');
      return null;
    }

    try {
      const messageBody = this.templates.cancellationNotice({
        salonName: appointment.salon?.name || 'LOBBA',
        clientName: appointment.client_name,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
      });

      const message = await this.client.messages.create({
        from: `whatsapp:${this.whatsappNumber}`,
        to: `whatsapp:${appointment.client_phone}`,
        body: messageBody,
      });

      await this.saveNotification({
        type: 'appointment_cancellation',
        appointment_id: appointment.id,
        to: appointment.client_phone,
        message_sid: message.sid,
        status: message.status,
        content: messageBody,
      });

      logger.info(`WhatsApp cancellation notice sent: ${message.sid}`);
      return message;
    } catch (error) {
      logger.error('Error sending cancellation notice:', error);
      return null;
    }
  }

  async sendSalonNotification(salonPhone, message) {
    if (!this.isInitialized()) {
      logger.warn('Twilio not initialized - skipping salon notification');
      return null;
    }

    try {
      const twilioMessage = await this.client.messages.create({
        from: `whatsapp:${this.whatsappNumber}`,
        to: `whatsapp:${salonPhone}`,
        body: message,
      });

      await this.saveNotification({
        type: 'salon_notification',
        to: salonPhone,
        message_sid: twilioMessage.sid,
        status: twilioMessage.status,
        content: message,
      });

      logger.info(`Salon notification sent: ${twilioMessage.sid}`);
      return twilioMessage;
    } catch (error) {
      logger.error('Error sending salon notification:', error);
      return null;
    }
  }

  async saveNotification(data) {
    try {
      const query = `
        INSERT INTO notifications (
          type, 
          appointment_id, 
          to_phone, 
          message_sid, 
          status, 
          content, 
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `;
      
      const values = [
        data.type,
        data.appointment_id || null,
        data.to,
        data.message_sid,
        data.status,
        data.content,
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error saving notification:', error);
      return null;
    }
  }

  async updateNotificationStatus(messageSid, newStatus) {
    try {
      const query = `
        UPDATE notifications 
        SET status = $1, updated_at = NOW()
        WHERE message_sid = $2
        RETURNING *
      `;
      
      const result = await pool.query(query, [newStatus, messageSid]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating notification status:', error);
      return null;
    }
  }

  async handleStatusWebhook(webhookData) {
    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = webhookData;

    logger.info(`Webhook received for ${MessageSid}: ${MessageStatus}`);

    await this.updateNotificationStatus(MessageSid, MessageStatus);

    if (ErrorCode) {
      logger.error(`Message ${MessageSid} error: ${ErrorCode} - ${ErrorMessage}`);
    }

    return { success: true };
  }

  templates = {
    appointmentConfirmation: ({ salonName, clientName, date, time, service }) => {
      return `🎉 *Confirmación de Cita - LOBBA*

Hola ${clientName},

✅ Tu cita ha sido confirmada en *${salonName}*

📅 Fecha: ${date}
🕐 Hora: ${time}
💅 Servicio: ${service}

Si necesitas modificar o cancelar tu cita, contacta directamente con el salón.

¡Te esperamos!

_Mensaje automático de LOBBA_`;
    },

    appointmentReminder: ({ salonName, clientName, date, time, service }) => {
      return `⏰ *Recordatorio de Cita - LOBBA*

Hola ${clientName},

Te recordamos tu cita de mañana en *${salonName}*

📅 Fecha: ${date}
🕐 Hora: ${time}
💅 Servicio: ${service}

Si necesitas cancelar, avisa al salón con antelación.

¡Nos vemos pronto!

_Mensaje automático de LOBBA_`;
    },

    cancellationNotice: ({ salonName, clientName, date, time }) => {
      return `❌ *Cita Cancelada - LOBBA*

Hola ${clientName},

Tu cita en *${salonName}* ha sido cancelada:

📅 Fecha: ${date}
🕐 Hora: ${time}

Puedes reservar una nueva cita cuando lo desees.

¡Gracias!

_Mensaje automático de LOBBA_`;
    },
  };
}

export { TwilioNotificationService };

const twilioNotificationService = new TwilioNotificationService();
export default twilioNotificationService;
