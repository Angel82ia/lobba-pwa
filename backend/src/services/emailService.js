/**
 * Email Service - SendGrid
 * 
 * Sistema de email profesional para LOBBA PWA
 * - Backup automático si WhatsApp falla
 * - Plantillas dinámicas
 * - Recuperación de contraseña
 * - Bienvenida y confirmaciones
 */

import sgMail from '@sendgrid/mail';
import logger from '../utils/logger.js';

class EmailService {
  constructor() {
    this.initialized = false;
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@lobba.es';
    this.fromName = process.env.EMAIL_FROM_NAME || 'LOBBA';
  }

  async initialize() {
    try {
      const apiKey = process.env.SENDGRID_API_KEY;

      if (!apiKey) {
        logger.warn('⚠️  SendGrid API key not configured - email service disabled');
        this.initialized = false;
        return false;
      }

      sgMail.setApiKey(apiKey);
      
      this.initialized = true;
      logger.info('✅ Email Service (SendGrid) initialized');
      return true;
    } catch (error) {
      logger.error('❌ SendGrid initialization failed:', error.message);
      this.initialized = false;
      return false;
    }
  }

  isInitialized() {
    return this.initialized;
  }

  async sendAppointmentConfirmation(appointment, userEmail) {
    if (!this.isInitialized()) {
      logger.warn('Email service not initialized - skipping appointment confirmation email');
      return null;
    }

    try {
      const msg = {
        to: userEmail,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: `Confirmación de cita - ${appointment.salon?.name || 'LOBBA'}`,
        html: this.templates.appointmentConfirmation({
          userName: appointment.client_name,
          salonName: appointment.salon?.name || 'LOBBA',
          date: appointment.appointment_date,
          time: appointment.appointment_time,
          service: appointment.service_type || 'servicio',
        }),
      };

      const result = await sgMail.send(msg);
      logger.info(`Email confirmation sent to ${userEmail}`);
      return result;
    } catch (error) {
      logger.error('Error sending appointment confirmation email:', error);
      return null;
    }
  }

  async sendAppointmentReminder(appointment, userEmail) {
    if (!this.isInitialized()) {
      logger.warn('Email service not initialized - skipping appointment reminder email');
      return null;
    }

    try {
      const msg = {
        to: userEmail,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: `Recordatorio: Cita mañana en ${appointment.salon?.name || 'LOBBA'}`,
        html: this.templates.appointmentReminder({
          userName: appointment.client_name,
          salonName: appointment.salon?.name || 'LOBBA',
          date: appointment.appointment_date,
          time: appointment.appointment_time,
          service: appointment.service_type || 'servicio',
        }),
      };

      const result = await sgMail.send(msg);
      logger.info(`Email reminder sent to ${userEmail}`);
      return result;
    } catch (error) {
      logger.error('Error sending appointment reminder email:', error);
      return null;
    }
  }

  async sendPasswordReset(userEmail, resetToken, userName) {
    if (!this.isInitialized()) {
      logger.warn('Email service not initialized - skipping password reset email');
      return null;
    }

    try {
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

      const msg = {
        to: userEmail,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: 'Recuperación de contraseña - LOBBA',
        html: this.templates.passwordReset({
          userName,
          resetLink,
        }),
      };

      const result = await sgMail.send(msg);
      logger.info(`Password reset email sent to ${userEmail}`);
      return result;
    } catch (error) {
      logger.error('Error sending password reset email:', error);
      return null;
    }
  }

  async sendWelcomeEmail(userEmail, userName) {
    if (!this.isInitialized()) {
      logger.warn('Email service not initialized - skipping welcome email');
      return null;
    }

    try {
      const msg = {
        to: userEmail,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: '¡Bienvenida a LOBBA! 🎉',
        html: this.templates.welcome({
          userName,
        }),
      };

      const result = await sgMail.send(msg);
      logger.info(`Welcome email sent to ${userEmail}`);
      return result;
    } catch (error) {
      logger.error('Error sending welcome email:', error);
      return null;
    }
  }

  async sendWithFallback(whatsappFn, emailFn) {
    try {
      const whatsappResult = await whatsappFn();
      
      if (!whatsappResult) {
        logger.warn('WhatsApp notification failed, using email backup');
        return await emailFn();
      }
      
      return whatsappResult;
    } catch (error) {
      logger.error('WhatsApp error, falling back to email:', error.message);
      try {
        return await emailFn();
      } catch (emailError) {
        logger.error('Email backup also failed:', emailError.message);
        return null;
      }
    }
  }

  templates = {
    appointmentConfirmation: ({ userName, salonName, date, time, service }) => {
      return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Cita</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; margin: 10px 0; }
    .detail-label { font-weight: bold; min-width: 80px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ ¡Cita Confirmada!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Tu cita ha sido confirmada exitosamente en <strong>${salonName}</strong>.</p>
      
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">📅 Fecha:</span>
          <span>${date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🕐 Hora:</span>
          <span>${time}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">💅 Servicio:</span>
          <span>${service}</span>
        </div>
      </div>
      
      <p>Si necesitas modificar o cancelar tu cita, contacta directamente con el salón.</p>
      <p>¡Te esperamos!</p>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático de LOBBA</p>
      <p>&copy; ${new Date().getFullYear()} LOBBA. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`;
    },

    appointmentReminder: ({ userName, salonName, date, time, service }) => {
      return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Cita</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; margin: 10px 0; }
    .detail-label { font-weight: bold; min-width: 80px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Recordatorio de Cita</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Te recordamos tu cita de mañana en <strong>${salonName}</strong>.</p>
      
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">📅 Fecha:</span>
          <span>${date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🕐 Hora:</span>
          <span>${time}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">💅 Servicio:</span>
          <span>${service}</span>
        </div>
      </div>
      
      <p>Si necesitas cancelar, avisa al salón con antelación.</p>
      <p>¡Nos vemos pronto!</p>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático de LOBBA</p>
      <p>&copy; ${new Date().getFullYear()} LOBBA. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`;
    },

    passwordReset: ({ userName, resetLink }) => {
      return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperación de Contraseña</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Recuperación de Contraseña</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Hemos recibido una solicitud para restablecer tu contraseña de LOBBA.</p>
      <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
      
      <center>
        <a href="${resetLink}" class="button">Restablecer Contraseña</a>
      </center>
      
      <p><strong>Este enlace expira en 1 hora.</strong></p>
      <p>Si no solicitaste este cambio, ignora este correo y tu contraseña permanecerá sin cambios.</p>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático de LOBBA</p>
      <p>&copy; ${new Date().getFullYear()} LOBBA. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`;
    },

    welcome: ({ userName }) => {
      return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenida a LOBBA</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ¡Bienvenida a LOBBA!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${userName}</strong>,</p>
      <p>¡Gracias por unirte a LOBBA! Estamos emocionados de tenerte con nosotros.</p>
      <p>Con LOBBA podrás:</p>
      <ul>
        <li>💅 Reservar citas en nuestros salones asociados</li>
        <li>🎨 Diseñar tus uñas con IA</li>
        <li>🛍️ Comprar productos cosméticos</li>
        <li>✨ Disfrutar de beneficios exclusivos</li>
      </ul>
      <p>¡Comienza a explorar ahora mismo!</p>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático de LOBBA</p>
      <p>&copy; ${new Date().getFullYear()} LOBBA. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`;
    },
  };
}

const emailService = new EmailService();

export default emailService;
