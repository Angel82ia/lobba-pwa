/**
 * WhatsApp Notification Templates for Salons
 * 
 * Templates específicos para notificaciones enviadas a salones
 * desde el número centralizado de LOBBA (+34614392922)
 */

/**
 * Template: Nueva reserva creada
 */
export const appointmentCreated = (data) => {
  const { client_name, client_phone, appointment_date, appointment_time, service_type, price, appointment_id } = data
  
  return `📱 *NUEVA RESERVA*

👤 Cliente: ${client_name}
📞 Teléfono: ${client_phone}
📅 Fecha: ${appointment_date}
🕐 Hora: ${appointment_time}
💅 Servicio: ${service_type}
💰 Precio: ${price}€

Reserva #${appointment_id}

_Notificación automática de LOBBA_`
}

/**
 * Template: Recordatorio de cita (24h antes)
 */
export const appointmentReminder = (data) => {
  const { client_name, client_phone, appointment_date, appointment_time, service_type, appointment_id } = data
  
  return `📅 *RECORDATORIO - CITA MAÑANA*

👤 Cliente: ${client_name}
📞 Teléfono: ${client_phone}
📅 Fecha: ${appointment_date}
🕐 Hora: ${appointment_time}
💅 Servicio: ${service_type}

Reserva #${appointment_id}

_Recordatorio automático de LOBBA_`
}

/**
 * Template: Cita cancelada
 */
export const appointmentCancelled = (data) => {
  const { client_name, client_phone, appointment_date, appointment_time, service_type, appointment_id, cancelled_by } = data
  
  const cancelledByText = cancelled_by === 'client' ? 'por la cliente' : 'por el sistema'
  
  return `❌ *CITA CANCELADA*

👤 Cliente: ${client_name}
📞 Teléfono: ${client_phone}
📅 Fecha: ${appointment_date}
🕐 Hora: ${appointment_time}
💅 Servicio: ${service_type}

Cancelada ${cancelledByText}

Reserva #${appointment_id}

_Notificación automática de LOBBA_`
}

/**
 * Template: Cita modificada
 */
export const appointmentUpdated = (data) => {
  const { client_name, client_phone, old_date, old_time, new_date, new_time, service_type, appointment_id } = data
  
  return `🔄 *CITA MODIFICADA*

👤 Cliente: ${client_name}
📞 Teléfono: ${client_phone}

*Antes:*
📅 ${old_date} - 🕐 ${old_time}

*Ahora:*
📅 ${new_date} - 🕐 ${new_time}

💅 Servicio: ${service_type}
Reserva #${appointment_id}

_Notificación automática de LOBBA_`
}

/**
 * Template: Pago confirmado
 */
export const paymentConfirmed = (data) => {
  const { client_name, appointment_date, appointment_time, service_type, amount, payment_method, appointment_id } = data
  
  return `✅ *PAGO CONFIRMADO*

👤 Cliente: ${client_name}
📅 Fecha: ${appointment_date}
🕐 Hora: ${appointment_time}
💅 Servicio: ${service_type}
💰 Monto: ${amount}€
💳 Método: ${payment_method}

Reserva #${appointment_id}

_Notificación automática de LOBBA_`
}

/**
 * Template: Cliente confirmó asistencia
 */
export const clientConfirmedAttendance = (data) => {
  const { client_name, appointment_date, appointment_time, service_type, appointment_id } = data
  
  return `✅ *CLIENTE CONFIRMÓ ASISTENCIA*

👤 Cliente: ${client_name}
📅 Fecha: ${appointment_date}
🕐 Hora: ${appointment_time}
💅 Servicio: ${service_type}

La cliente confirmó que asistirá a su cita.

Reserva #${appointment_id}

_Notificación automática de LOBBA_`
}

export default {
  appointmentCreated,
  appointmentReminder,
  appointmentCancelled,
  appointmentUpdated,
  paymentConfirmed,
  clientConfirmedAttendance
}
