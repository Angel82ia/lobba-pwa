import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MessageList from './MessageList'

describe('MessageList Component', () => {
  it('should render messages', () => {
    const messages = [
      {
        id: '1',
        content: 'Hello',
        sender_id: 'user-1',
        created_at: '2025-10-13T10:00:00Z',
      },
      {
        id: '2',
        content: 'Hi there',
        sender_id: 'user-2',
        created_at: '2025-10-13T10:01:00Z',
      },
    ]

    render(<MessageList messages={messages} currentUserId="user-1" />)

    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hi there')).toBeInTheDocument()
  })
})
