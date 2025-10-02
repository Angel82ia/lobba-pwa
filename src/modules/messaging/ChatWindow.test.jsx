import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ChatWindow from './ChatWindow'
import useStore from '../../store'
import * as messageService from '../../services/message'

vi.mock('../../store')
vi.mock('../../services/socket', () => ({
  connectSocket: vi.fn(),
  joinConversation: vi.fn(),
  onMessageReceived: vi.fn(),
}))
vi.mock('../../services/message')

const renderWithRouter = (conversationId = null) => {
  const route = conversationId ? `/messages/${conversationId}` : '/messages'
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/messages/:conversationId" element={<ChatWindow />} />
        <Route path="/messages" element={<ChatWindow />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ChatWindow Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useStore.mockReturnValue({
      auth: {
        isAuthenticated: true,
        user: { id: 'user-123' },
      },
    })
    messageService.getMessages.mockResolvedValue([])
    
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('should render empty state without conversationId', () => {
    renderWithRouter()
    expect(screen.getByText(/selecciona una conversación/i)).toBeInTheDocument()
  })

  it('should render chat window with conversationId', async () => {
    renderWithRouter('user1:user2')
    
    await waitFor(() => {
      expect(screen.getByText(/mensajes/i)).toBeInTheDocument()
    })
  })
})
