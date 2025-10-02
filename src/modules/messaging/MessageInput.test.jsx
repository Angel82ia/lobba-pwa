import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MessageInput from './MessageInput'

vi.mock('../../services/message', () => ({
  sendMessage: vi.fn(() => Promise.resolve({ id: 'msg-123' })),
}))

describe('MessageInput Component', () => {
  it('should render input field', () => {
    const mockOnSendMessage = vi.fn(() => ({ receiverId: 'user-456', content: '' }))
    render(<MessageInput onSendMessage={mockOnSendMessage} />)
    expect(screen.getByPlaceholderText(/escribe un mensaje/i)).toBeInTheDocument()
  })

  it('should call onSendMessage when form is submitted', () => {
    const onSendMessage = vi.fn(() => ({ receiverId: 'user-456', content: 'Test message' }))
    render(<MessageInput onSendMessage={onSendMessage} />)

    const input = screen.getByPlaceholderText(/escribe un mensaje/i)
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.submit(input.closest('form'))

    expect(onSendMessage).toHaveBeenCalledWith('Test message')
  })

  it('should clear input after sending', async () => {
    const onSendMessage = vi.fn(() => ({ receiverId: 'user-456', content: 'Test message' }))
    render(<MessageInput onSendMessage={onSendMessage} />)

    const input = screen.getByPlaceholderText(/escribe un mensaje/i)
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.submit(input.closest('form'))

    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })
})
