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
      expect(screen.getByText(/Soy Olivia/)).toBeInTheDocument()
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
    
    fireEvent.click(screen.getByLabelText('Cerrar chat'))
    
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
      userMessage: { id: '1', content: 'Hello', sender_type: 'user', created_at: new Date().toISOString() },
      botMessage: { id: '2', content: 'Hi there!', sender_type: 'bot', created_at: new Date().toISOString() },
      conversationId: 'conv-123'
    })
    
    render(<ChatbotWidget />)
    
    fireEvent.click(screen.getByLabelText('Abrir chat con Olivia'))
    
    await waitFor(() => {
      expect(screen.getByText('Asistente LOBBA')).toBeInTheDocument()
    })
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...')
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.submit(input.closest('form'))
    
    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith('Hello')
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
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
      expect(screen.getByText('Asistente LOBBA')).toBeInTheDocument()
    })
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...')
    fireEvent.submit(input.closest('form'))
    
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('should clear conversation', async () => {
    vi.mocked(getConversation).mockResolvedValue({
      conversation: { id: 'conv-123' },
      messages: [
        { id: '1', content: 'Test message', sender_type: 'user', created_at: new Date().toISOString() }
      ]
    })
    
    vi.mocked(clearConversation).mockResolvedValue({ success: true })
    
    // Mock window.confirm
    global.confirm = vi.fn(() => true)
    
    render(<ChatbotWidget />)
    
    fireEvent.click(screen.getByLabelText('Abrir chat con Olivia'))
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByLabelText('Limpiar conversación'))
    
    await waitFor(() => {
      expect(clearConversation).toHaveBeenCalled()
    })
  })
})
