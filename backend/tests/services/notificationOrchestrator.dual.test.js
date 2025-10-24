import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotificationOrchestrator } from '../../src/services/notificationOrchestrator.js'

describe('NotificationOrchestrator - Dual Notifications (Socias + Salones)', () => {
  let orchestrator
  let mockTwilioService
  let mockEmailService

  beforeEach(() => {
    mockTwilioService = {
      isConfigured: vi.fn(() => true),
      sendAppointmentConfirmation: vi.fn(() => Promise.resolve({ sid: 'MSG123', body: 'Test message' })),
      sendAppointmentReminder: vi.fn(() => Promise.resolve({ sid: 'MSG456', body: 'Test reminder' })),
      sendAppointmentCancellation: vi.fn(() => Promise.resolve({ sid: 'MSG789', body: 'Test cancellation' })),
      sendWhatsApp: vi.fn(() => Promise.resolve({ sid: 'MSG_SALON', body: 'Salon message' })),
    }

    mockEmailService = {
      isConfigured: vi.fn(() => true),
      sendAppointmentConfirmation: vi.fn(() => Promise.resolve([{ headers: { 'x-message-id': 'EMAIL123' } }])),
      sendAppointmentReminder: vi.fn(() => Promise.resolve([{ headers: { 'x-message-id': 'EMAIL456' } }])),
      sendAppointmentCancellation: vi.fn(() => Promise.resolve([{ headers: { 'x-message-id': 'EMAIL789' } }])),
      sendEmail: vi.fn(() => Promise.resolve(true)),
    }

    orchestrator = new NotificationOrchestrator(mockTwilioService, mockEmailService)
    
    orchestrator.logNotification = vi.fn(() => Promise.resolve({ id: 1 }))
  })

  describe('sendAppointmentConfirmation - Dual Notifications', () => {
    it('debe enviar WhatsApp a socia Y salón cuando ambos tienen teléfono', async () => {
      const appointment = {
        id: 1,
        client_name: 'María García',
        client_phone: '+34666111222',
        client_email: 'maria@example.com',
        appointment_date: '2025-10-25',
        appointment_time: '10:00',
        service_type: 'Manicura',
        price: 25,
      }

      const salonData = {
        business_name: 'Salón Belleza',
        contact_phone: '+34666333444',
        owner_email: 'salon@example.com',
      }

      const results = await orchestrator.sendAppointmentConfirmation(appointment, salonData)

      expect(mockTwilioService.sendAppointmentConfirmation).toHaveBeenCalledTimes(1)
      expect(mockTwilioService.sendWhatsApp).toHaveBeenCalledTimes(1)
      
      expect(mockTwilioService.sendWhatsApp).toHaveBeenCalledWith({
        to: '+34666333444',
        body: expect.stringContaining('NUEVA RESERVA'),
      })
      
      expect(mockTwilioService.sendWhatsApp).toHaveBeenCalledWith({
        to: '+34666333444',
        body: expect.stringContaining('María García'),
      })

      expect(results.whatsapp).toBeTruthy()
      expect(results.salonWhatsapp).toBeTruthy()
    })

    it('debe enviar solo a socia si salón no tiene contact_phone', async () => {
      const appointment = {
        id: 1,
        client_name: 'María García',
        client_phone: '+34666111222',
        client_email: 'maria@example.com',
        appointment_date: '2025-10-25',
        appointment_time: '10:00',
        service_type: 'Manicura',
        price: 25,
      }

      const salonData = {
        business_name: 'Salón Belleza',
        contact_phone: null,
        owner_email: 'salon@example.com',
      }

      const results = await orchestrator.sendAppointmentConfirmation(appointment, salonData)

      expect(mockTwilioService.sendAppointmentConfirmation).toHaveBeenCalledTimes(1)
      expect(mockTwilioService.sendWhatsApp).not.toHaveBeenCalled()
      
      expect(results.whatsapp).toBeTruthy()
      expect(results.salonWhatsapp).toBeNull()
    })

    it('debe incluir información correcta en mensaje al salón', async () => {
      const appointment = {
        id: 123,
        client_name: 'Ana López',
        client_phone: '+34666555777',
        appointment_date: '2025-10-26',
        appointment_time: '15:30',
        service_type: 'Pedicura',
        price: 30,
      }

      const salonData = {
        business_name: 'Salón Premium',
        contact_phone: '+34666888999',
        owner_email: 'premium@example.com',
      }

      await orchestrator.sendAppointmentConfirmation(appointment, salonData)

      const salonWhatsAppCall = mockTwilioService.sendWhatsApp.mock.calls[0][0]
      
      expect(salonWhatsAppCall.body).toContain('Ana López')
      expect(salonWhatsAppCall.body).toContain('+34666555777')
      expect(salonWhatsAppCall.body).toContain('2025-10-26')
      expect(salonWhatsAppCall.body).toContain('15:30')
      expect(salonWhatsAppCall.body).toContain('Pedicura')
      expect(salonWhatsAppCall.body).toContain('30€')
      expect(salonWhatsAppCall.body).toContain('Reserva #123')
    })
  })

  describe('sendAppointmentReminder - Dual Notifications', () => {
    it('debe enviar recordatorio a socia Y salón', async () => {
      const appointment = {
        id: 2,
        client_name: 'Pedro Martínez',
        client_phone: '+34666222333',
        client_email: 'pedro@example.com',
        appointment_date: '2025-10-27',
        appointment_time: '11:00',
        service_type: 'Corte de pelo',
      }

      const salonData = {
        business_name: 'Peluquería Moderna',
        contact_phone: '+34666444555',
        owner_email: 'moderna@example.com',
      }

      const results = await orchestrator.sendAppointmentReminder(appointment, salonData)

      expect(mockTwilioService.sendAppointmentReminder).toHaveBeenCalledTimes(1)
      expect(mockTwilioService.sendWhatsApp).toHaveBeenCalledTimes(1)
      
      expect(mockTwilioService.sendWhatsApp).toHaveBeenCalledWith({
        to: '+34666444555',
        body: expect.stringContaining('RECORDATORIO'),
      })

      expect(results.whatsapp).toBeTruthy()
      expect(results.salonWhatsapp).toBeTruthy()
    })

    it('debe incluir información de la cita en recordatorio al salón', async () => {
      const appointment = {
        id: 456,
        client_name: 'Laura Sánchez',
        client_phone: '+34666777888',
        appointment_date: '2025-10-28',
        appointment_time: '16:00',
        service_type: 'Tinte',
      }

      const salonData = {
        business_name: 'Salón Color',
        contact_phone: '+34666999000',
      }

      await orchestrator.sendAppointmentReminder(appointment, salonData)

      const salonWhatsAppCall = mockTwilioService.sendWhatsApp.mock.calls[0][0]
      
      expect(salonWhatsAppCall.body).toContain('Laura Sánchez')
      expect(salonWhatsAppCall.body).toContain('2025-10-28')
      expect(salonWhatsAppCall.body).toContain('16:00')
      expect(salonWhatsAppCall.body).toContain('Tinte')
      expect(salonWhatsAppCall.body).toContain('Reserva #456')
    })
  })

  describe('sendAppointmentCancellation - Dual Notifications', () => {
    it('debe enviar cancelación a socia Y salón', async () => {
      const appointment = {
        id: 3,
        client_name: 'Carlos Ruiz',
        client_phone: '+34666333444',
        client_email: 'carlos@example.com',
        appointment_date: '2025-10-29',
        appointment_time: '12:00',
        service_type: 'Masaje',
      }

      const salonData = {
        business_name: 'Spa Relax',
        contact_phone: '+34666555666',
        owner_email: 'spa@example.com',
      }

      const reason = 'Cancelada por la cliente'

      const results = await orchestrator.sendAppointmentCancellation(appointment, salonData, reason)

      expect(mockTwilioService.sendAppointmentCancellation).toHaveBeenCalledTimes(1)
      expect(mockTwilioService.sendWhatsApp).toHaveBeenCalledTimes(1)
      
      expect(mockTwilioService.sendWhatsApp).toHaveBeenCalledWith({
        to: '+34666555666',
        body: expect.stringContaining('CANCELADA'),
      })

      expect(results.whatsapp).toBeTruthy()
      expect(results.salonWhatsapp).toBeTruthy()
    })

    it('debe indicar quién canceló la cita en mensaje al salón', async () => {
      const appointment = {
        id: 789,
        client_name: 'Elena Torres',
        client_phone: '+34666111000',
        appointment_date: '2025-10-30',
        appointment_time: '14:00',
        service_type: 'Depilación',
      }

      const salonData = {
        business_name: 'Centro Estética',
        contact_phone: '+34666222111',
      }

      const reason = 'Cancelada por la cliente'

      await orchestrator.sendAppointmentCancellation(appointment, salonData, reason)

      const salonWhatsAppCall = mockTwilioService.sendWhatsApp.mock.calls[0][0]
      
      expect(salonWhatsAppCall.body).toContain('Elena Torres')
      expect(salonWhatsAppCall.body).toContain('por la cliente')
      expect(salonWhatsAppCall.body).toContain('Reserva #789')
    })
  })

  describe('Manejo de errores - Envío dual', () => {
    it('debe continuar enviando a salón aunque falle envío a socia', async () => {
      mockTwilioService.sendAppointmentConfirmation.mockRejectedValueOnce(new Error('Twilio error'))

      const appointment = {
        id: 1,
        client_name: 'Test User',
        client_phone: '+34666000001',
        appointment_date: '2025-10-25',
        appointment_time: '10:00',
        service_type: 'Test',
        price: 20,
      }

      const salonData = {
        business_name: 'Test Salon',
        contact_phone: '+34666000002',
        owner_email: 'test@example.com',
      }

      const results = await orchestrator.sendAppointmentConfirmation(appointment, salonData)

      expect(results.whatsapp.error).toBe('Twilio error')
      expect(results.salonWhatsapp).toBeTruthy()
      expect(mockTwilioService.sendWhatsApp).toHaveBeenCalled()
    })

    it('debe continuar enviando a socia aunque falle envío a salón', async () => {
      mockTwilioService.sendWhatsApp.mockRejectedValueOnce(new Error('Salon WhatsApp error'))

      const appointment = {
        id: 1,
        client_name: 'Test User',
        client_phone: '+34666000001',
        appointment_date: '2025-10-25',
        appointment_time: '10:00',
        service_type: 'Test',
        price: 20,
      }

      const salonData = {
        business_name: 'Test Salon',
        contact_phone: '+34666000002',
        owner_email: 'test@example.com',
      }

      const results = await orchestrator.sendAppointmentConfirmation(appointment, salonData)

      expect(results.whatsapp).toBeTruthy()
      expect(results.salonWhatsapp.error).toBe('Salon WhatsApp error')
    })
  })

  describe('Logging de notificaciones duales', () => {
    it('debe crear logs separados para socia y salón', async () => {
      const appointment = {
        id: 1,
        client_name: 'Test User',
        client_phone: '+34666000001',
        client_email: 'test@example.com',
        appointment_date: '2025-10-25',
        appointment_time: '10:00',
        service_type: 'Test',
        price: 20,
      }

      const salonData = {
        business_name: 'Test Salon',
        contact_phone: '+34666000002',
        owner_email: 'test@example.com',
      }

      await orchestrator.sendAppointmentConfirmation(appointment, salonData)

      expect(orchestrator.logNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'appointment_confirmation',
          toPhone: '+34666000001',
        })
      )

      expect(orchestrator.logNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'appointment_confirmation_salon',
          toPhone: '+34666000002',
        })
      )
    })
  })
})
