import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BannerDisplay from './BannerDisplay'
import { getActiveBanners } from '../../services/banner'

vi.mock('../../services/banner')

describe('BannerDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when no active banners', async () => {
    vi.mocked(getActiveBanners).mockResolvedValue([])
    
    const { container } = render(<BannerDisplay />)
    
    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it('should render single banner', async () => {
    const mockBanners = [
      {
        id: '1',
        title: 'Test Banner',
        content: 'Test content',
        type: 'announcement',
        image_url: null
      }
    ]
    
    vi.mocked(getActiveBanners).mockResolvedValue(mockBanners)
    
    render(<BannerDisplay />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Banner')).toBeInTheDocument()
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })
  })

  it('should render banner with image', async () => {
    const mockBanners = [
      {
        id: '1',
        title: 'Banner with Image',
        content: 'Content with image',
        type: 'promotion',
        image_url: 'https://example.com/image.jpg'
      }
    ]
    
    vi.mocked(getActiveBanners).mockResolvedValue(mockBanners)
    
    render(<BannerDisplay />)
    
    await waitFor(() => {
      const image = screen.getByAltText('Banner with Image')
      expect(image).toBeInTheDocument()
      expect(image.src).toBe('https://example.com/image.jpg')
    })
  })

  it('should dismiss banner when close button clicked', async () => {
    const mockBanners = [
      {
        id: '1',
        title: 'Dismissible Banner',
        content: 'This can be dismissed',
        type: 'news',
        image_url: null
      }
    ]
    
    vi.mocked(getActiveBanners).mockResolvedValue(mockBanners)
    
    render(<BannerDisplay />)
    
    await waitFor(() => {
      expect(screen.getByText('Dismissible Banner')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByLabelText('Cerrar banner'))
    
    await waitFor(() => {
      expect(screen.queryByText('Dismissible Banner')).not.toBeInTheDocument()
    })
  })

  it('should rotate through multiple banners', async () => {
    const mockBanners = [
      {
        id: '1',
        title: 'First Banner',
        content: 'First content',
        type: 'announcement',
        image_url: null
      },
      {
        id: '2',
        title: 'Second Banner',
        content: 'Second content',
        type: 'news',
        image_url: null
      }
    ]
    
    vi.mocked(getActiveBanners).mockResolvedValue(mockBanners)
    
    render(<BannerDisplay />)
    
    await waitFor(() => {
      expect(screen.getByText('First Banner')).toBeInTheDocument()
    })
    
    const dots = document.querySelectorAll('.banner-dots span')
    expect(dots).toHaveLength(2)
  })

  it('should handle banner type classes', async () => {
    const testCases = ['announcement', 'news', 'promotion']
    
    for (const type of testCases) {
      const mockBanners = [
        {
          id: '1',
          title: `${type} Banner`,
          content: `${type} content`,
          type: type,
          image_url: null
        }
      ]
      
      vi.mocked(getActiveBanners).mockResolvedValue(mockBanners)
      
      const { container } = render(<BannerDisplay />)
      
      await waitFor(() => {
        const banner = container.querySelector(`.banner-${type}`)
        expect(banner).toBeInTheDocument()
      })
    }
  })

  it('should handle API errors gracefully', async () => {
    vi.mocked(getActiveBanners).mockRejectedValue(new Error('API Error'))
    
    const { container } = render(<BannerDisplay />)
    
    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })
})
