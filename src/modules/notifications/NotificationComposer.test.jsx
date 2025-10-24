import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NotificationComposer from './NotificationComposer'
import * as notificationService from '../../services/notification'

vi.mock('../../services/notification')

describe('NotificationComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render notification composer form', () => {
    render(<NotificationComposer />)

    expect(screen.getByRole('heading', { name: /Enviar Notificación/ })).toBeInTheDocument()
    expect(screen.getByLabelText('Título')).toBeInTheDocument()
    expect(screen.getByLabelText('Mensaje')).toBeInTheDocument()
    expect(screen.getByLabelText('Tipo')).toBeInTheDocument()
  })

  it('should update form fields', () => {
    render(<NotificationComposer />)

    const titleInput = screen.getByLabelText('Título')
    fireEvent.change(titleInput, { target: { value: 'Nueva Oferta' } })

    expect(titleInput.value).toBe('Nueva Oferta')
  })

  it('should show preview of notification', () => {
    render(<NotificationComposer />)

    const titleInput = screen.getByLabelText('Título')
    const bodyInput = screen.getByLabelText('Mensaje')

    fireEvent.change(titleInput, { target: { value: 'Oferta Especial' } })
    fireEvent.change(bodyInput, { target: { value: 'Descuento del 20%' } })

    expect(screen.getByText('Vista previa')).toBeInTheDocument()
    // Verify preview content is visible (text appears twice - in input and preview)
    expect(screen.getAllByText('Oferta Especial').length).toBeGreaterThan(1)
    expect(screen.getByText('Descuento del 20%')).toBeInTheDocument()
  })

  it('should send notification successfully', async () => {
    notificationService.sendNotification.mockResolvedValue({
      success_count: 50,
    })

    render(<NotificationComposer />)

    const titleInput = screen.getByLabelText('Título')
    const bodyInput = screen.getByLabelText('Mensaje')
    const submitButton = screen.getByRole('button', { name: /Enviar Notificación/ })

    fireEvent.change(titleInput, { target: { value: 'Test Title' } })
    fireEvent.change(bodyInput, { target: { value: 'Test Body' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(notificationService.sendNotification).toHaveBeenCalled()
      expect(screen.getByText(/Notificación enviada correctamente/i)).toBeInTheDocument()
    })
  })

  it('should show error for missing fields', async () => {
    render(<NotificationComposer />)

    const submitButton = screen.getByRole('button', { name: /Enviar Notificación/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Por favor completa todos los campos')).toBeInTheDocument()
    })
  })

  it('should handle send notification error', async () => {
    notificationService.sendNotification.mockRejectedValue({
      response: { data: { message: 'Error al enviar' } },
    })

    render(<NotificationComposer />)

    const titleInput = screen.getByLabelText('Título')
    const bodyInput = screen.getByLabelText('Mensaje')
    const submitButton = screen.getByRole('button', { name: /Enviar Notificación/ })

    fireEvent.change(titleInput, { target: { value: 'Test' } })
    fireEvent.change(bodyInput, { target: { value: 'Test' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Error al enviar')).toBeInTheDocument()
    })
  })

  it('should show radius slider for geographic targeting', () => {
    render(<NotificationComposer />)

    const targetingSelect = screen.getByLabelText('Tipo de Segmentación')
    fireEvent.change(targetingSelect, { target: { value: 'geographic' } })

    expect(screen.getByText(/Radio \(kilómetros\)/)).toBeInTheDocument()
    expect(screen.getByText(/10 km/)).toBeInTheDocument()
  })
})
