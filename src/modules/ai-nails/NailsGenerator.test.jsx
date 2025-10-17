import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NailsGenerator from './NailsGenerator'
import * as aiService from '../../services/ai'

vi.mock('../../services/ai')

describe('NailsGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    aiService.getQuota.mockResolvedValue({
      nails: { hasQuota: true, used: 50, limit: 100, remaining: 50 }
    })
  })

  it('should render nails generator', async () => {
    render(<NailsGenerator />)

    await waitFor(() => {
      expect(screen.getByText(/Generador de Diseños de Uñas/)).toBeInTheDocument()
    })
  })

  it('should show quota information', async () => {
    render(<NailsGenerator />)

    await waitFor(() => {
      expect(screen.getByText(/Diseños restantes:/)).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
    })
  })

  it('should update prompt field', async () => {
    render(<NailsGenerator />)

    const textarea = await screen.findByLabelText('Describe tu diseño ideal')
    fireEvent.change(textarea, { target: { value: 'Pink nails' } })

    expect(textarea.value).toBe('Pink nails')
  })

  it('should generate nail design', async () => {
    const mockResult = {
      generation: {
        id: 'gen-1',
        output_image_url: '/image.png',
        generation_time_ms: 1000,
        ai_provider: 'mock'
      },
      quota: { remaining: 49 }
    }

    aiService.generateNailDesign.mockResolvedValue(mockResult)

    render(<NailsGenerator />)

    const textarea = await screen.findByLabelText('Describe tu diseño ideal')
    const generateButton = screen.getByText(/Generar Diseño/)

    fireEvent.change(textarea, { target: { value: 'Pink nails' } })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(aiService.generateNailDesign).toHaveBeenCalledWith('Pink nails')
      expect(screen.getByText(/Tu diseño generado/)).toBeInTheDocument()
    })
  })

  it('should show error for empty prompt', async () => {
    render(<NailsGenerator />)

    const generateButton = await screen.findByText(/Generar Diseño/)
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Por favor ingresa una descripción')).toBeInTheDocument()
    })
  })

  it('should handle generation error', async () => {
    aiService.generateNailDesign.mockRejectedValue({
      response: { data: { message: 'Quota exceeded' } }
    })

    render(<NailsGenerator />)

    const textarea = await screen.findByLabelText('Describe tu diseño ideal')
    const generateButton = screen.getByText(/Generar Diseño/)

    fireEvent.change(textarea, { target: { value: 'Pink nails' } })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Quota exceeded')).toBeInTheDocument()
    })
  })
})
