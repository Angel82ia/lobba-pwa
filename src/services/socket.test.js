import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { connectSocket, disconnectSocket, joinConversation, sendMessage } from './socket'

vi.mock('socket.io-client', () => ({
  default: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  })),
}))

describe('Socket Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    disconnectSocket()
  })

  it('should connect to socket with token', () => {
    const socket = connectSocket('test-token')
    expect(socket).toBeDefined()
  })

  it('should disconnect socket', () => {
    const socket = connectSocket('test-token')
    disconnectSocket()
    expect(socket.disconnect).toHaveBeenCalled()
  })

  it('should join conversation', () => {
    const socket = connectSocket('test-token')
    joinConversation('conversation-123')
    expect(socket.emit).toHaveBeenCalledWith('join_conversation', 'conversation-123')
  })

  it('should send message', () => {
    const socket = connectSocket('test-token')
    sendMessage('conversation-123', 'Hello')
    expect(socket.emit).toHaveBeenCalled()
  })
})
