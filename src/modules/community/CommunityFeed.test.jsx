import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CommunityFeed from './CommunityFeed'
import * as communityService from '../../services/community'

vi.mock('../../services/community')

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('CommunityFeed', () => {
  const mockPosts = [
    {
      id: '1',
      user_id: 'user-1',
      content: 'Test post 1',
      first_name: 'John',
      last_name: 'Doe',
      likes_count: 5,
      comments_count: 2,
      user_has_liked: false,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      user_id: 'user-2',
      content: 'Test post 2',
      first_name: 'Jane',
      last_name: 'Smith',
      likes_count: 3,
      comments_count: 1,
      user_has_liked: true,
      created_at: new Date().toISOString()
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    communityService.getAllPosts.mockResolvedValue(mockPosts)
    communityService.getFeed.mockResolvedValue(mockPosts)
  })

  it('should render community feed', async () => {
    renderWithRouter(<CommunityFeed />)

    await waitFor(() => {
      expect(screen.getByText('Comunidad LOBBA')).toBeInTheDocument()
    })
  })

  it('should load and display posts', async () => {
    renderWithRouter(<CommunityFeed />)

    await waitFor(() => {
      expect(screen.getByText('Test post 1')).toBeInTheDocument()
      expect(screen.getByText('Test post 2')).toBeInTheDocument()
    })
  })

  it('should switch between all and following filters', async () => {
    renderWithRouter(<CommunityFeed />)

    await waitFor(() => {
      expect(screen.getByText('Todos')).toBeInTheDocument()
    })

    const followingButton = screen.getByText('Siguiendo')
    fireEvent.click(followingButton)

    await waitFor(() => {
      expect(communityService.getFeed).toHaveBeenCalled()
    })
  })

  it('should show post composer', async () => {
    renderWithRouter(<CommunityFeed />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('¿Qué estás pensando?')).toBeInTheDocument()
    })
  })
})
