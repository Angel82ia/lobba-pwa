/**
 * WhatsApp Click-to-Chat System - V3.0
 * NO usa Twilio API, solo genera enlaces wa.me
 * Cada salón tiene su propio número WhatsApp
 */

const MESSAGE_TEMPLATES = {
  general: (salon, booking, user) =>
    `Hola ${salon.business_name} 👋\n\nSoy ${user.first_name}, tengo una reserva:\n📅 ${booking.scheduled_date} a las ${booking.scheduled_time}\n📋 Reserva #${booking.short_id}\n\n¿Podrías confirmarme los detalles?`,

  confirm_pending: (salon, booking, user) =>
    `Hola ${salon.business_name} 👋\n\nSoy ${user.first_name}. Acabo de hacer una reserva:\n📅 ${booking.scheduled_date} a las ${booking.scheduled_time}\n📋 Reserva #${booking.short_id}\n\n¿Podrías confirmarla? ¡Gracias!`,

  change_time: (salon, booking, _user) =>
    `Hola ${salon.business_name} 👋\n\nTengo reserva el ${booking.scheduled_date} a las ${booking.scheduled_time} (#${booking.short_id})\n\n¿Sería posible cambiar la hora? Gracias`,

  running_late: (salon, booking, _user) =>
    `Hola ${salon.business_name} 👋\n\nTengo reserva hoy a las ${booking.scheduled_time} (#${booking.short_id})\n\nVoy a llegar un poco tarde. ¡Disculpa las molestias!`,

  cancel: (salon, booking, _user) =>
    `Hola ${salon.business_name} 👋\n\nTengo reserva el ${booking.scheduled_date} a las ${booking.scheduled_time} (#${booking.short_id})\n\nNecesito cancelarla. ¿Me podrías ayudar? Gracias`,

  question: (salon, booking, user) =>
    `Hola ${salon.business_name} 👋\n\nSoy ${user.first_name}. Tengo una consulta sobre mi reserva #${booking.short_id}:\n\n`,
}

/**
 * Generar enlace WhatsApp click-to-chat
 * @param {Object} salon - Datos del salón con whatsapp_number
 * @param {Object} booking - Datos de la reserva (opcional)
 * @param {Object} user - Datos del usuario
 * @param {String} context - Tipo de mensaje: general, confirm_pending, change_time, running_late, cancel, question
 * @returns {String|null} - URL wa.me o null si WhatsApp no habilitado
 */
export const generateWhatsAppLink = (salon, booking = null, user = {}, context = 'general') => {
  if (!salon.whatsapp_enabled || !salon.whatsapp_number) {
    return null
  }

  const cleanNumber = salon.whatsapp_number.replace(/[^\d+]/g, '')

  if (!cleanNumber.startsWith('+')) {
    console.warn(`WhatsApp number for salon ${salon.id} should start with +`)
    return null
  }

  const template = MESSAGE_TEMPLATES[context] || MESSAGE_TEMPLATES.general
  const message = template(salon, booking, user)

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
}

/**
 * @deprecated OBSOLETO - No enviar mensajes automáticos, solo click-to-chat
 * Mantener solo para compatibilidad temporal
 */
export const sendWhatsAppMessage = async ({ to: _to, body: _body }) => {
  console.warn('sendWhatsAppMessage is DEPRECATED. Use generateWhatsAppLink instead.')
  return {
    sid: 'deprecated',
    status: 'not_sent',
    message: 'WhatsApp automatic sending is disabled. Use click-to-chat instead.',
  }
}

/**
 * @deprecated OBSOLETO - No enviar mensajes automáticos
 * Usar generateWhatsAppLink con context='confirm_pending'
 */
export const sendReservationConfirmation = async _reservation => {
  console.warn('sendReservationConfirmation is DEPRECATED. Use generateWhatsAppLink instead.')
  return { status: 'not_sent', message: 'Use click-to-chat instead' }
}

/**
 * @deprecated OBSOLETO - No enviar mensajes automáticos
 * Usar generateWhatsAppLink con context='general'
 */
export const sendReservationReminder = async _reservation => {
  console.warn('sendReservationReminder is DEPRECATED. Use generateWhatsAppLink instead.')
  return { status: 'not_sent', message: 'Use click-to-chat instead' }
}

/**
 * @deprecated OBSOLETO - No enviar mensajes automáticos
 * Usar generateWhatsAppLink con context='cancel'
 */
export const sendReservationCancellation = async _reservation => {
  console.warn('sendReservationCancellation is DEPRECATED. Use generateWhatsAppLink instead.')
  return { status: 'not_sent', message: 'Use click-to-chat instead' }
}
