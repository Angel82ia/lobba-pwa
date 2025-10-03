import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatbotWidget from './ChatbotWidget'
import { sendMessage, getConversation, clearConversation } from '../../services/chatbot'

vi.mock('../../services/chatbot')

describe('ChatbotWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render chatbot button when closed', () => {
    render(<ChatbotWidget />)
    
    const button = screen.getByLabelText('Abrir chat con Olivia')
    expect(button).toBeInTheDocument()
    expect(screen.getByText('Olivia')).toBeInTheDocument()
  })

  it('should open chatbot window when button clicked', async () => {
    vi.mocked(getConversation).mockResolvedValue({
      conversation: { id: 'conv-123' },
      messages: []
    })
    
    render(<ChatbotWidget />)
    
    fireEvent.click(screen.getByLabelText('Abrir chat con Olivia'))
    
    await waitFor(() => {
      expect(screen.getByText('Asistente LOBBA')).toBeInTheDocument()
      expect(screen.getByText(/¡Hola! Soy Olivia, tu asistente virtual de LOBBA/)).toBeInTheDocument()
    })
    
    expect(getConversation).toHaveBeenCalled()
  })

  it('should close chatbot window when close button clicked', async () => {
    vi.mocked(getConversation).mockResolvedValue({
      conversation: { id: 'conv-123' },
      messages: []
    })
    
    render(<ChatbotWidget />)
    
    fireEvent.click(screen.getByLabelText('Abrir chat con Olivia'))
    
    await waitFor(() => {
      expect(screen.getByText('Asistente LOBBA')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('✕'))
    
    await waitFor(() => {
      expect(screen.queryByText('Asistente LOBBA')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Abrir chat con Olivia')).toBeInTheDocument()
    })
  })

  it('should send message and display responses', async () => {
    vi.mocked(getConversation).mockResolvedValue({
      conversation: { id: 'conv-123' },
      messages: []
    })
    
    vi.mocked(sendMessage).mockResolvedValue({
      userMessage: { id: '1', content: 'Hello', sender_type: 'user' },
      botMessage: { id: '2', content: 'Hi there!', sender_type: 'bot' },
      conversationId: 'conv-123'
    })
    
    render(<ChatbotWidget />)
    
    fireEvent.click(screen.getByLabelText('Abrir chat con Olivia'))
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Escribe tu mensaje...')).toBeInTheDocument()
    })
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...')
    const sendButton = screen.getByText('Enviar')
    
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })
    
    expect(sendMessage).toHaveBeenCalledWith('Hello')
  })

  it('should clear conversation when clear button clicked', async () => {
    vi.mocked(getConversation).mockResolvedValue({
      conversation: { id: 'conv-123' },
      messages: [
        { id: '1', content: 'Previous message', sender_type: 'user' }
      ]
    })
    
    vi.mocked(clearConversation).mockResolvedValue({
      message: 'Conversación limpiada correctamente'
    })
    
    window.confirm = vi.fn(() => true)
    
    render(<ChatbotWidget />)
    
    fireEvent.click(screen.getByLabelText('Abrir chat con Olivia'))
    
    await waitFor(() => {
      expect(screen.getByText('Previous message')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByTitle('Limpiar conversación'))
    
    await waitFor(() => {
      expect(clearConversation).toHaveBeenCalled()
    })
  })

  it('should display error message when send fails', async () => {
    vi.mocked(getConversation).mockResolvedValue({
      conversation: { id: 'conv-123' },
      messages: []
    })
    
    vi.mocked(sendMessage).mockRejectedValue(new Error('API Error'))
    
    render(<ChatbotWidget />)
    
    fireEvent.click(screen.getByLabelText('Abrir chat con Olivia'))
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Escribe tu mensaje...')).toBeInTheDocument()
    })
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...')
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.submit(input.form)
    
    await waitFor(() => {
      expect(screen.getByText('Error al enviar mensaje')).toBeInTheDocument()
    })
  })

  it('should not send empty messages', async () => {
    vi.mocked(getConversation).mockResolvedValue({
      conversation: { id: 'conv-123' },
      messages: []
    })
    
    render(<ChatbotWidget />)
    
    fireEvent.click(screen.getByLabelText('Abrir chat con Olivia'))
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Escribe tu mensaje...')).toBeInTheDocument()
    })
    
    const sendButton = screen.getByText('Enviar')
    expect(sendButton).toBeDisabled()
    
    fireEvent.click(sendButton)
    
    expect(sendMessage).not.toHaveBeenCalled()
  })
})
