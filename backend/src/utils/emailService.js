import nodemailer from 'nodemailer'
import logger from './logger.js'

let transporter = null

const initializeEmailTransporter = () => {
  if (transporter) return transporter

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.warn('Email configuration not found. Email sending will be disabled.')
    return null
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  return transporter
}

export const sendEmail = async ({ to, subject, html, text }) => {
  const emailTransporter = initializeEmailTransporter()

  if (!emailTransporter) {
    logger.warn('Email transporter not configured. Email not sent:', { to, subject })
    return { messageId: 'mock-email-id', status: 'skipped' }
  }

  try {
    const info = await emailTransporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'LOBBA'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    })

    logger.info('Email sent successfully:', { to, subject, messageId: info.messageId })
    return info
  } catch (error) {
    logger.error('Error sending email:', error)
    throw error
  }
}

export const sendReservationConfirmationEmail = async reservation => {
  const { client_email, start_time, salon_profile, service, first_name } = reservation

  if (!client_email) {
    logger.warn('No client email for reservation:', reservation.id)
    return null
  }

  const startDate = new Date(start_time)
  const formattedDate = startDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = startDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const subject = `✅ Reserva confirmada en ${salon_profile.business_name}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF1493 0%, #C71585 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .detail { margin: 15px 0; padding: 10px; background: white; border-left: 4px solid #FF1493; }
        .detail strong { color: #FF1493; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Reserva Confirmada</h1>
        </div>
        <div class="content">
          <p>Hola ${first_name || 'Cliente'},</p>
          <p>Tu reserva ha sido confirmada con éxito. ¡Te esperamos!</p>
          
          <div class="detail">
            <strong>Salón:</strong> ${salon_profile.business_name}
          </div>
          <div class="detail">
            <strong>Servicio:</strong> ${service.name}
          </div>
          <div class="detail">
            <strong>Fecha:</strong> ${formattedDate}
          </div>
          <div class="detail">
            <strong>Hora:</strong> ${formattedTime}
          </div>
          
          <p style="margin-top: 30px;">Si necesitas cancelar o modificar tu reserva, puedes hacerlo desde tu cuenta en la app LOBBA.</p>
          
          <div class="footer">
            <p>Este es un email automático de LOBBA. Por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Reserva Confirmada

Hola ${first_name || 'Cliente'},

Tu reserva ha sido confirmada:

Salón: ${salon_profile.business_name}
Servicio: ${service.name}
Fecha: ${formattedDate}
Hora: ${formattedTime}

¡Te esperamos!

- LOBBA
  `

  return sendEmail({ to: client_email, subject, html, text })
}

export const sendReservationCancellationEmail = async reservation => {
  const { client_email, salon_profile, cancellation_reason, first_name } = reservation

  if (!client_email) {
    logger.warn('No client email for reservation:', reservation.id)
    return null
  }

  const subject = `❌ Reserva cancelada en ${salon_profile.business_name}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .detail { margin: 15px 0; padding: 10px; background: white; border-left: 4px solid #dc2626; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Reserva Cancelada</h1>
        </div>
        <div class="content">
          <p>Hola ${first_name || 'Cliente'},</p>
          <p>Tu reserva en <strong>${salon_profile.business_name}</strong> ha sido cancelada.</p>
          
          ${cancellation_reason ? `
          <div class="detail">
            <strong>Motivo:</strong> ${cancellation_reason}
          </div>
          ` : ''}
          
          <p style="margin-top: 30px;">Si el pago fue procesado, el reembolso se realizará en los próximos días.</p>
          <p>Si tienes alguna duda, no dudes en contactarnos.</p>
          
          <div class="footer">
            <p>Este es un email automático de LOBBA. Por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Reserva Cancelada

Hola ${first_name || 'Cliente'},

Tu reserva en ${salon_profile.business_name} ha sido cancelada.

${cancellation_reason ? `Motivo: ${cancellation_reason}` : ''}

Si el pago fue procesado, el reembolso se realizará en los próximos días.

- LOBBA
  `

  return sendEmail({ to: client_email, subject, html, text })
}

export const sendReservationReminderEmail = async reservation => {
  const { client_email, start_time, salon_profile, service, first_name } = reservation

  if (!client_email) {
    logger.warn('No client email for reservation:', reservation.id)
    return null
  }

  const startDate = new Date(start_time)
  const formattedDate = startDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = startDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const subject = `🔔 Recordatorio: Tu cita en ${salon_profile.business_name} es mañana`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF1493 0%, #C71585 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .detail { margin: 15px 0; padding: 10px; background: white; border-left: 4px solid #FF1493; }
        .detail strong { color: #FF1493; }
        .reminder-box { background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Recordatorio de Cita</h1>
        </div>
        <div class="content">
          <p>Hola ${first_name || 'Cliente'},</p>
          
          <div class="reminder-box">
            <strong>⏰ Tu cita es mañana</strong>
          </div>
          
          <div class="detail">
            <strong>Salón:</strong> ${salon_profile.business_name}
          </div>
          <div class="detail">
            <strong>Servicio:</strong> ${service.name}
          </div>
          <div class="detail">
            <strong>Fecha:</strong> ${formattedDate}
          </div>
          <div class="detail">
            <strong>Hora:</strong> ${formattedTime}
          </div>
          
          <p style="margin-top: 30px;">¡No olvides asistir! Si necesitas cancelar, hazlo cuanto antes desde la app LOBBA.</p>
          
          <div class="footer">
            <p>Este es un email automático de LOBBA. Por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
🔔 Recordatorio de Cita

Hola ${first_name || 'Cliente'},

Tu cita es mañana:

Salón: ${salon_profile.business_name}
Servicio: ${service.name}
Fecha: ${formattedDate}
Hora: ${formattedTime}

¡No olvides asistir!

- LOBBA
  `

  return sendEmail({ to: client_email, subject, html, text })
}

export const sendNewReservationToSalonEmail = async (reservation, salonEmail) => {
  const { start_time, service, first_name, last_name, client_phone, notes } = reservation

  if (!salonEmail) {
    logger.warn('No salon email provided')
    return null
  }

  const startDate = new Date(start_time)
  const formattedDate = startDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = startDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const subject = `📅 Nueva Reserva - ${first_name} ${last_name}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF1493 0%, #C71585 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .detail { margin: 15px 0; padding: 10px; background: white; border-left: 4px solid #FF1493; }
        .detail strong { color: #FF1493; }
        .action-box { background: #e8f5e9; border: 2px solid #4caf50; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Nueva Reserva</h1>
        </div>
        <div class="content">
          <p>Has recibido una nueva reserva:</p>
          
          <div class="detail">
            <strong>Cliente:</strong> ${first_name} ${last_name}
          </div>
          <div class="detail">
            <strong>Servicio:</strong> ${service.name}
          </div>
          <div class="detail">
            <strong>Fecha:</strong> ${formattedDate}
          </div>
          <div class="detail">
            <strong>Hora:</strong> ${formattedTime}
          </div>
          ${client_phone ? `
          <div class="detail">
            <strong>Teléfono:</strong> ${client_phone}
          </div>
          ` : ''}
          ${notes ? `
          <div class="detail">
            <strong>Notas:</strong> ${notes}
          </div>
          ` : ''}
          
          <div class="action-box">
            <strong>Accede a tu panel de LOBBA para gestionar esta reserva</strong>
          </div>
          
          <div class="footer">
            <p>Este es un email automático de LOBBA. Por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Nueva Reserva

Cliente: ${first_name} ${last_name}
Servicio: ${service.name}
Fecha: ${formattedDate}
Hora: ${formattedTime}
${client_phone ? `Teléfono: ${client_phone}` : ''}
${notes ? `Notas: ${notes}` : ''}

Accede a tu panel de LOBBA para gestionar esta reserva.

- LOBBA
  `

  return sendEmail({ to: salonEmail, subject, html, text })
}
