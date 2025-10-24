/**
 * Script de Testing - Sistema de Notificaciones FASE 2
 * 
 * Verifica la integración completa del sistema híbrido WhatsApp
 * 
 * Uso: node test-notification-system.js
 */

import { TwilioNotificationService } from './src/services/twilioNotificationService.js'
import { EmailService } from './src/services/emailService.js'
import { NotificationOrchestrator } from './src/services/notificationOrchestrator.js'
import dotenv from 'dotenv'

dotenv.config()

console.log('🧪 Testing Sistema de Notificaciones FASE 2\n')

const twilioService = new TwilioNotificationService()
const emailService = new EmailService()
const orchestrator = new NotificationOrchestrator(twilioService, emailService)

console.log('📊 Estado de Servicios:')
console.log('========================')
console.log(`Twilio WhatsApp: ${twilioService.isConfigured() ? '✅ Configurado' : '❌ No configurado'}`)
console.log(`SendGrid Email: ${emailService.isConfigured() ? '✅ Configurado' : '❌ No configurado'}`)
console.log('')

if (twilioService.isConfigured()) {
  console.log('📱 Configuración Twilio:')
  console.log(`  Account SID: ${process.env.TWILIO_ACCOUNT_SID?.substring(0, 10)}...`)
  console.log(`  Número WhatsApp: ${process.env.TWILIO_WHATSAPP_FROM}`)
  console.log('')
}

if (emailService.isConfigured()) {
  console.log('📧 Configuración SendGrid:')
  console.log(`  API Key: ${process.env.SENDGRID_API_KEY?.substring(0, 10)}...`)
  console.log(`  From Email: ${process.env.SENDGRID_FROM_EMAIL}`)
  console.log(`  From Name: ${process.env.SENDGRID_FROM_NAME}`)
  console.log('')
}

console.log('🔧 Templates de Mensajes:')
console.log('========================')

const testAppointment = {
  id: 999,
  client_name: 'María Test',
  client_phone: '+34600000000',
  client_email: 'test@example.com',
  appointment_date: '20 de octubre de 2024',
  appointment_time: '15:30',
  service_type: 'Corte y peinado',
}

const testSalon = {
  name: 'Salón de Prueba',
  business_name: 'Salón de Prueba',
  owner_email: 'salon@example.com',
}

console.log('\n📝 Template Confirmación WhatsApp:')
console.log('----------------------------------')
if (twilioService.isConfigured()) {
  const whatsappTemplate = twilioService.templates.appointmentConfirmation(testAppointment)
  console.log(whatsappTemplate)
} else {
  console.log('⚠️  Twilio no configurado - template no disponible')
}

console.log('\n📝 Template Recordatorio WhatsApp:')
console.log('----------------------------------')
if (twilioService.isConfigured()) {
  const reminderTemplate = twilioService.templates.appointmentReminder(testAppointment)
  console.log(reminderTemplate)
} else {
  console.log('⚠️  Twilio no configurado - template no disponible')
}

console.log('\n📝 Template Email HTML:')
console.log('----------------------------------')
if (emailService.isConfigured()) {
  const emailTemplate = emailService.templates.appointmentConfirmation({
    userName: testAppointment.client_name,
    salonName: testSalon.business_name,
    date: testAppointment.appointment_date,
    time: testAppointment.appointment_time,
    service: testAppointment.service_type,
  })
  console.log(emailTemplate.substring(0, 300) + '...')
} else {
  console.log('⚠️  SendGrid no configurado - template no disponible')
}

console.log('\n\n✅ Verificación Completada')
console.log('========================')

if (!twilioService.isConfigured() && !emailService.isConfigured()) {
  console.log('\n⚠️  ADVERTENCIA:')
  console.log('  No hay servicios configurados. El sistema funcionará en modo degradado.')
  console.log('  Para configurar, añade estas variables al archivo .env:')
  console.log('')
  console.log('  # Twilio WhatsApp')
  console.log('  TWILIO_ACCOUNT_SID=ACxxxx')
  console.log('  TWILIO_AUTH_TOKEN=xxxx')
  console.log('  TWILIO_WHATSAPP_FROM=whatsapp:+34614392922')
  console.log('')
  console.log('  # SendGrid Email')
  console.log('  SENDGRID_API_KEY=SG.xxxx')
  console.log('  SENDGRID_FROM_EMAIL=notifications@lobba.com')
  console.log('  SENDGRID_FROM_NAME=LOBBA')
  console.log('')
} else {
  console.log('✨ Sistema listo para enviar notificaciones')
  console.log('')
  console.log('Para testing real:')
  console.log('1. Crear una cita desde la PWA')
  console.log('2. Verificar tabla notifications en BD')
  console.log('3. Revisar logs del backend')
  console.log('4. Verificar recepción en WhatsApp/Email')
}
