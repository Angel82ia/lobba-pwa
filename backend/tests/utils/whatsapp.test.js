import { describe, it, expect, beforeEach } from 'vitest'
import { generateWhatsAppLink } from '../../src/utils/whatsapp.js'

describe('WhatsApp Click-to-Chat V3.0', () => {
  const mockSalon = {
    id: 1,
    business_name: 'Salón Test',
    whatsapp_number: '+34666123456',
    whatsapp_enabled: true
  }

  const mockBooking = {
    id: 123,
    short_id: 'R000123',
    scheduled_date: '15/10/2025',
    scheduled_time: '14:30'
  }

  const mockUser = {
    first_name: 'María',
    last_name: 'García'
  }

  beforeEach(() => {
  })

  describe('generateWhatsAppLink', () => {
    it('should generate link for general context', () => {
      const link = generateWhatsAppLink(mockSalon, mockBooking, mockUser, 'general')
      
      expect(link).toContain('https://wa.me/34666123456')
      expect(link).toContain('Hola%20Sal%C3%B3n%20Test')
      expect(link).toContain('Mar%C3%ADa')
    })

    it('should generate link for confirm_pending context', () => {
      const link = generateWhatsAppLink(mockSalon, mockBooking, mockUser, 'confirm_pending')
      
      expect(link).toContain('https://wa.me/34666123456')
      expect(link).toContain('R000123')
      expect(link).toContain('14%3A30')
    })

    it('should generate link for running_late context', () => {
      const link = generateWhatsAppLink(mockSalon, mockBooking, mockUser, 'running_late')
      
      expect(link).toContain('https://wa.me/34666123456')
      expect(link).toContain('llegar%20un%20poco%20tarde')
    })

    it('should generate link for cancel context', () => {
      const link = generateWhatsAppLink(mockSalon, mockBooking, mockUser, 'cancel')
      
      expect(link).toContain('https://wa.me/34666123456')
      expect(link).toContain('cancelarla')
    })

    it('should return null if whatsapp not enabled', () => {
      const salonNoWhatsApp = { ...mockSalon, whatsapp_enabled: false }
      const link = generateWhatsAppLink(salonNoWhatsApp, mockBooking, mockUser)
      
      expect(link).toBeNull()
    })

    it('should return null if whatsapp number missing', () => {
      const salonNoNumber = { ...mockSalon, whatsapp_number: null }
      const link = generateWhatsAppLink(salonNoNumber, mockBooking, mockUser)
      
      expect(link).toBeNull()
    })

    it('should clean phone number correctly', () => {
      const salonDirty = { 
        ...mockSalon, 
        whatsapp_number: '+34 666 12 34 56' 
      }
      const link = generateWhatsAppLink(salonDirty, mockBooking, mockUser)
      
      expect(link).toContain('https://wa.me/34666123456')
    })

    it('should work without booking data', () => {
      const link = generateWhatsAppLink(mockSalon, null, mockUser, 'general')
      
      expect(link).toBeDefined()
    })

    it('should work without user data', () => {
      const link = generateWhatsAppLink(mockSalon, mockBooking, {}, 'general')
      
      expect(link).toContain('https://wa.me/34666123456')
    })
  })
})
