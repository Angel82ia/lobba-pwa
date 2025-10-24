/**
 * Notification Orchestrator - FASE 2 Sistema Híbrido WhatsApp
 * 
 * Orquesta el envío de notificaciones multi-canal:
 * 1. WhatsApp ONE-WAY (Twilio) - Número LOBBA +34614392922
 * 2. Email (SendGrid)
 * 3. Notificaciones internas (sistema existente)
 * 
 * MODELO HÍBRIDO:
 * - Salones mantienen sus números de WhatsApp para click-to-chat (sin cambios)
 * - LOBBA usa número centralizado para notificaciones automatizadas ONE-WAY
 */

import pool from '../config/database.js'
import logger from '../utils/logger.js'
import salonTemplates from '../templates/salonNotifications.js'

export class NotificationOrchestrator {
  constructor(twilioService, emailService) {
    this.twilioService = twilioService
    this.emailService = emailService
  }

  /**
   * Guardar notificación en BD para tracking
   */
  async logNotification(data) {
    try {
      const result = await pool.query(
        `INSERT INTO notifications 
         (type, appointment_id, to_phone, to_email, message_sid, status, content, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [
          data.type,
          data.appointmentId,
          data.toPhone,
          data.toEmail,
          data.messageSid,
          data.status,
          data.content,
        ]
      )
      return result.rows[0]
    } catch (error) {
      logger.error('Error logging notification:', error)
      throw error
    }
  }

  /**
   * Actualizar estado de notificación (desde webhook)
   */
  async updateNotificationStatus(messageSid, status, errorInfo = null) {
    try {
      await pool.query(
        `UPDATE notifications 
         SET status = $1, 
             error_code = $2, 
             error_message = $3,
             updated_at = NOW()
         WHERE message_sid = $4`,
        [status, errorInfo?.code, errorInfo?.message, messageSid]
      )
    } catch (error) {
      logger.error('Error updating notification status:', error)
    }
  }

  /**
   * Enviar confirmación de cita creada
   * - WhatsApp a la socia (número LOBBA)
   * - Email a la socia
   * - WhatsApp al salón (número LOBBA) ← NUEVO
   * - Email al salón
   */
  async sendAppointmentConfirmation(appointment, salonData) {
    const results = {
      whatsapp: null,
      email: null,
      salonWhatsapp: null,
      salonEmail: false,
    }

    try {
      if (this.twilioService.isConfigured() && appointment.client_phone) {
        try {
          const whatsappResult = await this.twilioService.sendAppointmentConfirmation({
            client_name: appointment.client_name,
            client_phone: appointment.client_phone,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            service_type: appointment.service_type,
            salon: salonData,
          })

          results.whatsapp = whatsappResult

          await this.logNotification({
            type: 'appointment_confirmation',
            appointmentId: appointment.id,
            toPhone: appointment.client_phone,
            messageSid: whatsappResult.sid,
            status: 'sent',
            content: whatsappResult.body,
          })

          logger.info(`✅ WhatsApp enviado a socia ${appointment.client_phone}`)
        } catch (error) {
          logger.error('WhatsApp send error (client):', error)
          results.whatsapp = { error: error.message }

          await this.logNotification({
            type: 'appointment_confirmation',
            appointmentId: appointment.id,
            toPhone: appointment.client_phone,
            status: 'failed',
            content: error.message,
          })
        }
      }

      if (this.emailService.isConfigured() && appointment.client_email) {
        try {
          const emailResult = await this.emailService.sendAppointmentConfirmation(
            {
              client_name: appointment.client_name,
              appointment_date: appointment.appointment_date,
              appointment_time: appointment.appointment_time,
              service_type: appointment.service_type,
              salon: salonData,
            },
            appointment.client_email
          )

          results.email = emailResult

          await this.logNotification({
            type: 'appointment_confirmation',
            appointmentId: appointment.id,
            toEmail: appointment.client_email,
            messageSid: emailResult[0]?.headers?.['x-message-id'],
            status: 'sent',
            content: `Email confirmation sent`,
          })

          logger.info(`✅ Email enviado a socia ${appointment.client_email}`)
        } catch (error) {
          logger.error('Email send error (client):', error)
          results.email = { error: error.message }

          await this.logNotification({
            type: 'appointment_confirmation',
            appointmentId: appointment.id,
            toEmail: appointment.client_email,
            status: 'failed',
            content: error.message,
          })
        }
      }

      if (this.twilioService.isConfigured() && salonData.contact_phone) {
        try {
          const salonWhatsappMessage = salonTemplates.appointmentCreated({
            client_name: appointment.client_name,
            client_phone: appointment.client_phone || 'No proporcionado',
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            service_type: appointment.service_type || 'Servicio general',
            price: appointment.price || '0',
            appointment_id: appointment.id,
          })

          const salonWhatsappResult = await this.twilioService.sendWhatsApp({
            to: salonData.contact_phone,
            body: salonWhatsappMessage,
          })

          results.salonWhatsapp = salonWhatsappResult

          await this.logNotification({
            type: 'appointment_confirmation_salon',
            appointmentId: appointment.id,
            toPhone: salonData.contact_phone,
            messageSid: salonWhatsappResult.sid,
            status: 'sent',
            content: salonWhatsappMessage,
          })

          logger.info(`✅ WhatsApp enviado a salón ${salonData.business_name} (${salonData.contact_phone})`)
        } catch (error) {
          logger.error('WhatsApp send error (salon):', error)
          results.salonWhatsapp = { error: error.message }

          await this.logNotification({
            type: 'appointment_confirmation_salon',
            appointmentId: appointment.id,
            toPhone: salonData.contact_phone,
            status: 'failed',
            content: error.message,
          })
        }
      }

      if (salonData.owner_email) {
        try {
          await this.notifySalonNewAppointment(appointment, salonData)
          results.salonEmail = true
          logger.info(`✅ Email enviado a salón ${salonData.business_name}`)
        } catch (error) {
          logger.error('Salon email notification error:', error)
        }
      }
    } catch (error) {
      logger.error('Appointment confirmation orchestration error:', error)
    }

    return results
  }

  /**
   * Enviar recordatorio 24h antes
   * - WhatsApp a la socia (número LOBBA)
   * - Email a la socia
   * - WhatsApp al salón (número LOBBA)
   */
  async sendAppointmentReminder(appointment, salonData) {
    const results = {
      whatsapp: null,
      email: null,
      salonWhatsapp: null,
    }

    try {
      if (this.twilioService.isConfigured() && appointment.client_phone) {
        try {
          const whatsappResult = await this.twilioService.sendAppointmentReminder({
            client_name: appointment.client_name,
            client_phone: appointment.client_phone,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            service_type: appointment.service_type,
            salon: salonData,
          })

          results.whatsapp = whatsappResult

          await this.logNotification({
            type: 'appointment_reminder',
            appointmentId: appointment.id,
            toPhone: appointment.client_phone,
            messageSid: whatsappResult.sid,
            status: 'sent',
            content: whatsappResult.body,
          })

          await pool.query(
            'UPDATE appointments SET reminder_sent = TRUE, reminder_sent_at = NOW() WHERE id = $1',
            [appointment.id]
          )

          logger.info(`✅ Recordatorio WhatsApp enviado a socia ${appointment.client_phone}`)
        } catch (error) {
          logger.error('WhatsApp reminder error (client):', error)
          results.whatsapp = { error: error.message }
        }
      }

      if (this.emailService.isConfigured() && appointment.client_email) {
        try {
          const emailResult = await this.emailService.sendAppointmentReminder(
            {
              client_name: appointment.client_name,
              appointment_date: appointment.appointment_date,
              appointment_time: appointment.appointment_time,
              service_type: appointment.service_type,
              salon: salonData,
            },
            appointment.client_email
          )

          results.email = emailResult
          logger.info(`✅ Recordatorio Email enviado a socia ${appointment.client_email}`)
        } catch (error) {
          logger.error('Email reminder error (client):', error)
          results.email = { error: error.message }
        }
      }

      if (this.twilioService.isConfigured() && salonData.contact_phone) {
        try {
          const salonWhatsappMessage = salonTemplates.appointmentReminder({
            client_name: appointment.client_name,
            client_phone: appointment.client_phone || 'No proporcionado',
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            service_type: appointment.service_type || 'Servicio general',
            appointment_id: appointment.id,
          })

          const salonWhatsappResult = await this.twilioService.sendWhatsApp({
            to: salonData.contact_phone,
            body: salonWhatsappMessage,
          })

          results.salonWhatsapp = salonWhatsappResult

          await this.logNotification({
            type: 'appointment_reminder_salon',
            appointmentId: appointment.id,
            toPhone: salonData.contact_phone,
            messageSid: salonWhatsappResult.sid,
            status: 'sent',
            content: salonWhatsappMessage,
          })

          logger.info(`✅ Recordatorio WhatsApp enviado a salón ${salonData.business_name} (${salonData.contact_phone})`)
        } catch (error) {
          logger.error('WhatsApp reminder error (salon):', error)
          results.salonWhatsapp = { error: error.message }

          await this.logNotification({
            type: 'appointment_reminder_salon',
            appointmentId: appointment.id,
            toPhone: salonData.contact_phone,
            status: 'failed',
            content: error.message,
          })
        }
      }
    } catch (error) {
      logger.error('Appointment reminder orchestration error:', error)
    }

    return results
  }

  /**
   * Enviar cancelación de cita
   * - WhatsApp a la socia
   * - Email a la socia
   * - WhatsApp al salón
   * - Email al salón
   */
  async sendAppointmentCancellation(appointment, salonData, reason) {
    const results = {
      whatsapp: null,
      email: null,
      salonWhatsapp: null,
      salonEmail: false,
    }

    try {
      if (this.twilioService.isConfigured() && appointment.client_phone) {
        try {
          const whatsappResult = await this.twilioService.sendAppointmentCancellation({
            client_name: appointment.client_name,
            client_phone: appointment.client_phone,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            salon: salonData,
            cancellation_reason: reason,
          })

          results.whatsapp = whatsappResult

          await this.logNotification({
            type: 'appointment_cancellation',
            appointmentId: appointment.id,
            toPhone: appointment.client_phone,
            messageSid: whatsappResult.sid,
            status: 'sent',
            content: whatsappResult.body,
          })

          logger.info(`✅ Cancelación WhatsApp enviada a socia ${appointment.client_phone}`)
        } catch (error) {
          logger.error('WhatsApp cancellation error (client):', error)
          results.whatsapp = { error: error.message }
        }
      }

      if (this.emailService.isConfigured() && appointment.client_email) {
        try {
          const emailResult = await this.emailService.sendAppointmentCancellation(
            {
              client_name: appointment.client_name,
              appointment_date: appointment.appointment_date,
              appointment_time: appointment.appointment_time,
              salon: salonData,
              cancellation_reason: reason,
            },
            appointment.client_email
          )

          results.email = emailResult
          logger.info(`✅ Cancelación Email enviada a socia ${appointment.client_email}`)
        } catch (error) {
          logger.error('Email cancellation error (client):', error)
          results.email = { error: error.message }
        }
      }

      if (this.twilioService.isConfigured() && salonData.contact_phone) {
        try {
          const cancelledBy = reason?.includes('cliente') ? 'client' : 'system'
          
          const salonWhatsappMessage = salonTemplates.appointmentCancelled({
            client_name: appointment.client_name,
            client_phone: appointment.client_phone || 'No proporcionado',
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            service_type: appointment.service_type || 'Servicio general',
            appointment_id: appointment.id,
            cancelled_by: cancelledBy,
          })

          const salonWhatsappResult = await this.twilioService.sendWhatsApp({
            to: salonData.contact_phone,
            body: salonWhatsappMessage,
          })

          results.salonWhatsapp = salonWhatsappResult

          await this.logNotification({
            type: 'appointment_cancellation_salon',
            appointmentId: appointment.id,
            toPhone: salonData.contact_phone,
            messageSid: salonWhatsappResult.sid,
            status: 'sent',
            content: salonWhatsappMessage,
          })

          logger.info(`✅ Cancelación WhatsApp enviada a salón ${salonData.business_name} (${salonData.contact_phone})`)
        } catch (error) {
          logger.error('WhatsApp cancellation error (salon):', error)
          results.salonWhatsapp = { error: error.message }

          await this.logNotification({
            type: 'appointment_cancellation_salon',
            appointmentId: appointment.id,
            toPhone: salonData.contact_phone,
            status: 'failed',
            content: error.message,
          })
        }
      }

      if (salonData.owner_email) {
        try {
          await this.notifySalonCancellation(appointment, salonData, reason)
          results.salonEmail = true
          logger.info(`✅ Email de cancelación enviado a salón ${salonData.business_name}`)
        } catch (error) {
          logger.error('Salon cancellation email error:', error)
        }
      }
    } catch (error) {
      logger.error('Appointment cancellation orchestration error:', error)
    }

    return results
  }

  /**
   * Notificar al salón de nueva cita (email interno)
   */
  async notifySalonNewAppointment(appointment, salonData) {
    if (!this.emailService.isConfigured() || !salonData.owner_email) {
      return
    }

    const emailData = {
      to: salonData.owner_email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: 'LOBBA Notificaciones',
      },
      subject: `Nueva cita - ${appointment.client_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Nueva Cita Reservada</h2>
          <p><strong>Salón:</strong> ${salonData.business_name}</p>
          <p><strong>Cliente:</strong> ${appointment.client_name}</p>
          <p><strong>Teléfono:</strong> ${appointment.client_phone || 'No proporcionado'}</p>
          <p><strong>Fecha:</strong> ${appointment.appointment_date}</p>
          <p><strong>Hora:</strong> ${appointment.appointment_time}</p>
          <p><strong>Servicio:</strong> ${appointment.service_type || 'Servicio general'}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Esta es una notificación automática de LOBBA. 
            La cliente también ha recibido su confirmación por WhatsApp y email.
          </p>
        </div>
      `,
    }

    await this.emailService.sendEmail(emailData)
  }

  /**
   * Notificar al salón de cancelación
   */
  async notifySalonCancellation(appointment, salonData, reason) {
    if (!this.emailService.isConfigured() || !salonData.owner_email) {
      return
    }

    const emailData = {
      to: salonData.owner_email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: 'LOBBA Notificaciones',
      },
      subject: `Cita Cancelada - ${appointment.client_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d9534f;">Cita Cancelada</h2>
          <p><strong>Salón:</strong> ${salonData.business_name}</p>
          <p><strong>Cliente:</strong> ${appointment.client_name}</p>
          <p><strong>Fecha:</strong> ${appointment.appointment_date}</p>
          <p><strong>Hora:</strong> ${appointment.appointment_time}</p>
          <p><strong>Motivo:</strong> ${reason || 'No especificado'}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Esta es una notificación automática de LOBBA.
          </p>
        </div>
      `,
    }

    await this.emailService.sendEmail(emailData)
  }

  /**
   * Obtener historial de notificaciones de una cita
   */
  async getAppointmentNotifications(appointmentId) {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications 
         WHERE appointment_id = $1 
         ORDER BY created_at DESC`,
        [appointmentId]
      )
      return result.rows
    } catch (error) {
      logger.error('Error fetching appointment notifications:', error)
      return []
    }
  }

  /**
   * Reenviar notificación fallida
   */
  async resendNotification(notificationId) {
    try {
      const result = await pool.query('SELECT * FROM notifications WHERE id = $1', [
        notificationId,
      ])

      if (result.rows.length === 0) {
        throw new Error('Notification not found')
      }

      const notification = result.rows[0]

      const appointmentResult = await pool.query(
        `SELECT a.*, sp.business_name, sp.owner_email
         FROM appointments a
         JOIN salon_profiles sp ON a.salon_profile_id = sp.id
         WHERE a.id = $1`,
        [notification.appointment_id]
      )

      if (appointmentResult.rows.length === 0) {
        throw new Error('Appointment not found')
      }

      const appointment = appointmentResult.rows[0]
      const salonData = {
        name: appointment.business_name,
        business_name: appointment.business_name,
        owner_email: appointment.owner_email,
      }

      switch (notification.type) {
        case 'appointment_confirmation':
          return await this.sendAppointmentConfirmation(appointment, salonData)
        case 'appointment_reminder':
          return await this.sendAppointmentReminder(appointment, salonData)
        case 'appointment_cancellation':
          return await this.sendAppointmentCancellation(
            appointment,
            salonData,
            appointment.cancellation_reason
          )
        default:
          throw new Error(`Unknown notification type: ${notification.type}`)
      }
    } catch (error) {
      logger.error('Error resending notification:', error)
      throw error
    }
  }
}

export default NotificationOrchestrator
