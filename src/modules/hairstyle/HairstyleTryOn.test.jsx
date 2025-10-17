import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HairstyleTryOn from './HairstyleTryOn'
import * as aiService from '../../services/ai'

vi.mock('../../services/ai')

describe('HairstyleTryOn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    aiService.getQuota.mockResolvedValue({
      hairstyle: { hasQuota: true, used: 2, limit: 4, remaining: 2 }
    })
    aiService.getCatalog.mockResolvedValue([
      { style_id: 'style-1', name: 'Long Waves', preview_image_url: '/style1.png' },
      { style_id: 'style-2', name: 'Short Bob', preview_image_url: '/style2.png' }
    ])
  })

  it('should render hairstyle try-on', async () => {
    render(<HairstyleTryOn />)

    await waitFor(() => {
      expect(screen.getByText(/Prueba Virtual de Peinados/)).toBeInTheDocument()
    })
  })

  it('should show quota information', async () => {
    render(<HairstyleTryOn />)

    await waitFor(() => {
      expect(screen.getByText(/Pruebas restantes:/)).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('should load hairstyle catalog', async () => {
    render(<HairstyleTryOn />)

    await waitFor(() => {
      expect(screen.getByText('Long Waves')).toBeInTheDocument()
      expect(screen.getByText('Short Bob')).toBeInTheDocument()
    })
  })

  it('should generate hairstyle', async () => {
    const mockResult = {
      generation: {
        id: 'gen-1',
        input_image_url: '/input.png',
        output_image_url: '/output.png',
        generation_time_ms: 1500,
        ai_provider: 'mock'
      },
      quota: { remaining: 1 }
    }

    aiService.generateHairstyle.mockResolvedValue(mockResult)

    const file = new File(['selfie'], 'selfie.png', { type: 'image/png' })

    render(<HairstyleTryOn />)

    await waitFor(() => {
      expect(screen.getByText('Long Waves')).toBeInTheDocument()
    })

    const uploadButton = screen.getByText(/Seleccionar Foto/)
    const input = uploadButton.parentElement.querySelector('input[type="file"]')

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByAltText('Tu selfie')).toBeInTheDocument()
    })

    // Click on style by finding its text and clicking parent div
    const styleElement = screen.getByText('Long Waves')
    fireEvent.click(styleElement.closest('div'))

    const generateButton = screen.getByText(/Probar Peinado/)
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(aiService.generateHairstyle).toHaveBeenCalled()
      expect(screen.getByText(/Tu nuevo look/)).toBeInTheDocument()
    })
  })

  it('should show error for missing selfie', async () => {
    render(<HairstyleTryOn />)

    await waitFor(() => {
      expect(screen.getByText('Long Waves')).toBeInTheDocument()
    })

    // Select style
    const styleElement = screen.getByText('Long Waves')
    fireEvent.click(styleElement.closest('div'))

    const generateButton = screen.getByText(/Probar Peinado/)
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Por favor sube una selfie')).toBeInTheDocument()
    })
  })
})
