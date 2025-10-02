import twilio from 'twilio'

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export const sendWhatsAppMessage = async ({ to, body }) => {
  if (!process.env.TWILIO_WHATSAPP_NUMBER) {
    console.warn('TWILIO_WHATSAPP_NUMBER not configured')
    return { sid: 'mock-sid' }
  }

  const message = await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: `whatsapp:${to}`,
    body,
  })

  return message
}

export const sendReservationConfirmation = async (reservation) => {
  const { client_phone, start_time, salon_profile, service } = reservation
  
  if (!client_phone) return null

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

  const body = `✅ Reserva confirmada en ${salon_profile.business_name}
  
Servicio: ${service.name}
Fecha: ${formattedDate}
Hora: ${formattedTime}

¡Te esperamos!`

  return sendWhatsAppMessage({ to: client_phone, body })
}

export const sendReservationReminder = async (reservation) => {
  const { client_phone, start_time, salon_profile } = reservation
  
  if (!client_phone) return null

  const startDate = new Date(start_time)
  const formattedTime = startDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const body = `🔔 Recordatorio: Tienes una cita en ${salon_profile.business_name} mañana a las ${formattedTime}.`

  return sendWhatsAppMessage({ to: client_phone, body })
}

export const sendReservationCancellation = async (reservation) => {
  const { client_phone, salon_profile, cancellation_reason } = reservation
  
  if (!client_phone) return null

  const body = `❌ Tu reserva en ${salon_profile.business_name} ha sido cancelada.
  
Motivo: ${cancellation_reason || 'No especificado'}

Si necesitas ayuda, contacta con nosotros.`

  return sendWhatsAppMessage({ to: client_phone, body })
}
