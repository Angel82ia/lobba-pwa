import { describe, it, expect } from 'vitest'
import { renderTemplate } from '../../src/services/notificationService.js'

describe('Notification Service - XSS Protection', () => {
  describe('renderTemplate', () => {
    it('should render template with valid variables', () => {
      const template = 'Hola {{user_name}}, tu reserva en {{salon_name}} está confirmada'
      const variables = {
        user_name: 'María',
        salon_name: 'Salón Belleza',
      }

      const result = renderTemplate(template, variables)

      expect(result).toBe('Hola María, tu reserva en Salón Belleza está confirmada')
    })

    it('should sanitize XSS attempts in variables', () => {
      const template = 'Usuario: {{user_name}}'
      const variables = {
        user_name: '<script>alert("XSS")</script>Juan',
      }

      const result = renderTemplate(template, variables, true)

      expect(result).not.toContain('<script>')
      expect(result).toContain('Juan')
    })

    it('should sanitize HTML injection', () => {
      const template = 'Email: {{user_email}}'
      const variables = {
        user_email: 'test@test.com<img src=x onerror=alert(1)>',
      }

      const result = renderTemplate(template, variables, true)

      expect(result).not.toContain('<img')
      expect(result).not.toContain('onerror')
      expect(result).toContain('test@test.com')
    })

    it('should handle missing variables with placeholder', () => {
      const template = 'Hola {{user_name}}, tu reserva en {{salon_name}}'
      const variables = {
        user_name: 'María',
        // salon_name missing
      }

      const result = renderTemplate(template, variables)

      expect(result).toBe('Hola María, tu reserva en [salon_name]')
    })

    it('should allow disabling HTML sanitization', () => {
      const template = 'Content: {{content}}'
      const variables = {
        content: '<b>Bold</b> text',
      }

      const resultSanitized = renderTemplate(template, variables, true)
      const resultUnsanitized = renderTemplate(template, variables, false)

      // Sanitizado debe remover tags HTML completamente
      expect(resultSanitized).not.toContain('<b>')
      expect(resultSanitized).not.toContain('</b>')
      expect(resultSanitized).toContain('Bold text')

      // Sin sanitizar debe mantener los tags
      expect(resultUnsanitized).toContain('<b>')
    })

    it('should handle special regex characters in variable names', () => {
      const template = 'Price: {{total_price}}'
      const variables = {
        total_price: '50.00€',
      }

      const result = renderTemplate(template, variables)

      expect(result).toBe('Price: 50.00€')
    })

    it('should handle null and undefined values', () => {
      const template = 'User: {{user_name}}, Age: {{age}}'
      const variables = {
        user_name: null,
        age: undefined,
      }

      const result = renderTemplate(template, variables)

      expect(result).toBe('User: [user_name], Age: [age]')
    })

    it('should handle multiple occurrences of same variable', () => {
      const template =
        '{{user_name}} ha reservado en {{salon_name}}. Contacta a {{user_name}} si necesitas.'
      const variables = {
        user_name: 'Pedro',
        salon_name: 'Salón XYZ',
      }

      const result = renderTemplate(template, variables)

      expect(result).toBe('Pedro ha reservado en Salón XYZ. Contacta a Pedro si necesitas.')
    })

    it('should sanitize event handler attributes', () => {
      const template = 'Link: {{link}}'
      const variables = {
        link: '<a href="#" onclick="alert(1)">Click</a>',
      }

      const result = renderTemplate(template, variables, true)

      expect(result).not.toContain('onclick')
      expect(result).not.toContain('alert')
    })

    it('should handle SQL injection attempts', () => {
      const template = 'User: {{user_name}}'
      const variables = {
        user_name: "'; DROP TABLE users; --",
      }

      const result = renderTemplate(template, variables)

      // Las comillas deben estar escapadas para prevenir injection
      expect(result).toBe('User: &#x27;; DROP TABLE users; --')
    })

    it('should handle emoji and special characters', () => {
      const template = 'Mensaje: {{message}}'
      const variables = {
        message: '¡Hola! 👋 Tu reserva está lista 🎉',
      }

      const result = renderTemplate(template, variables)

      expect(result).toBe('Mensaje: ¡Hola! 👋 Tu reserva está lista 🎉')
    })
  })
})
