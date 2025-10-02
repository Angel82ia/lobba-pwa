import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import pool from '../../src/config/database.js'
import {
  createGalleryImage,
  findGalleryImageById,
  findGalleryImagesBySalonId,
  updateGalleryImage,
  deleteGalleryImage,
  setImageAsCover,
} from '../../src/models/SalonGallery.js'

vi.mock('../../src/config/database.js')

describe('SalonGallery Model', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createGalleryImage', () => {
    it('should create a new gallery image with all fields', async () => {
      const mockResult = {
        rows: [{
          id: 'image-uuid',
          salon_profile_id: 'salon-uuid',
          cloudinary_public_id: 'lobba/salon-123/image-abc',
          cloudinary_url: 'https://res.cloudinary.com/demo/image/upload/v123/lobba/salon-123/image-abc.jpg',
          title: 'Sala principal',
          description: 'Vista de nuestro salón',
          is_cover: false,
          sort_order: 1,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const imageData = {
        salonProfileId: 'salon-uuid',
        cloudinaryPublicId: 'lobba/salon-123/image-abc',
        cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/v123/lobba/salon-123/image-abc.jpg',
        title: 'Sala principal',
        description: 'Vista de nuestro salón',
        sortOrder: 1,
      }

      const result = await createGalleryImage(imageData)

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          'salon-uuid',
          'lobba/salon-123/image-abc',
          'https://res.cloudinary.com/demo/image/upload/v123/lobba/salon-123/image-abc.jpg',
          'Sala principal',
          'Vista de nuestro salón',
          1,
        ])
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('INSERT INTO salon_gallery')
      expect(result).toEqual(mockResult.rows[0])
    })

    it('should create gallery image with minimal fields', async () => {
      const mockResult = {
        rows: [{
          id: 'image-uuid',
          salon_profile_id: 'salon-uuid',
          cloudinary_public_id: 'lobba/image-123',
          cloudinary_url: 'https://cloudinary.com/image.jpg',
          title: null,
          description: null,
          is_cover: false,
          sort_order: 0,
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const imageData = {
        salonProfileId: 'salon-uuid',
        cloudinaryPublicId: 'lobba/image-123',
        cloudinaryUrl: 'https://cloudinary.com/image.jpg',
      }

      const result = await createGalleryImage(imageData)

      expect(pool.query).toHaveBeenCalled()
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('findGalleryImageById', () => {
    it('should find gallery image by ID', async () => {
      const mockResult = {
        rows: [{
          id: 'image-uuid',
          salon_profile_id: 'salon-uuid',
          cloudinary_url: 'https://cloudinary.com/image.jpg',
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await findGalleryImageById('image-uuid')

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['image-uuid']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('SELECT')
      expect(sqlQuery).toContain('salon_gallery')
      expect(sqlQuery).toContain('WHERE id = $1')
      expect(result).toEqual(mockResult.rows[0])
    })

    it('should return undefined when image not found', async () => {
      const mockResult = { rows: [] }
      pool.query.mockResolvedValue(mockResult)

      const result = await findGalleryImageById('nonexistent')

      expect(result).toBeUndefined()
    })
  })

  describe('findGalleryImagesBySalonId', () => {
    it('should return all gallery images for a salon ordered by sort_order', async () => {
      const mockResult = {
        rows: [
          {
            id: 'image-1',
            salon_profile_id: 'salon-uuid',
            cloudinary_url: 'https://cloudinary.com/image1.jpg',
            is_cover: true,
            sort_order: 0,
          },
          {
            id: 'image-2',
            salon_profile_id: 'salon-uuid',
            cloudinary_url: 'https://cloudinary.com/image2.jpg',
            is_cover: false,
            sort_order: 1,
          },
        ],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await findGalleryImagesBySalonId('salon-uuid')

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['salon-uuid']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('SELECT')
      expect(sqlQuery).toContain('salon_gallery')
      expect(sqlQuery).toContain('WHERE salon_profile_id = $1')
      expect(sqlQuery).toContain('ORDER BY')
      expect(result).toEqual(mockResult.rows)
    })

    it('should return empty array when no images found', async () => {
      const mockResult = { rows: [] }
      pool.query.mockResolvedValue(mockResult)

      const result = await findGalleryImagesBySalonId('salon-uuid')

      expect(result).toEqual([])
    })
  })

  describe('updateGalleryImage', () => {
    it('should update gallery image fields', async () => {
      const mockResult = {
        rows: [{
          id: 'image-uuid',
          title: 'Nueva imagen',
          description: 'Actualizada',
          sort_order: 5,
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const updates = {
        title: 'Nueva imagen',
        description: 'Actualizada',
        sortOrder: 5,
      }

      const result = await updateGalleryImage('image-uuid', updates)

      expect(pool.query).toHaveBeenCalled()
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('UPDATE salon_gallery')
      expect(sqlQuery).toContain('updated_at = CURRENT_TIMESTAMP')
      expect(result).toEqual(mockResult.rows[0])
    })

    it('should handle empty updates', async () => {
      const mockResult = {
        rows: [{
          id: 'image-uuid',
          title: 'Existing Image',
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await updateGalleryImage('image-uuid', {})

      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('deleteGalleryImage', () => {
    it('should delete gallery image', async () => {
      const mockResult = {
        rows: [{
          id: 'image-uuid',
          cloudinary_public_id: 'lobba/image-123',
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await deleteGalleryImage('image-uuid')

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['image-uuid']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('DELETE FROM salon_gallery')
      expect(sqlQuery).toContain('WHERE id = $1')
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('setImageAsCover', () => {
    it('should set image as cover and unset other covers', async () => {
      const mockUpdateResult = {
        rows: [{ id: 'old-cover', is_cover: false }],
      }
      const mockSetResult = {
        rows: [{
          id: 'new-cover',
          salon_profile_id: 'salon-uuid',
          is_cover: true,
        }],
      }

      pool.query
        .mockResolvedValueOnce(mockUpdateResult)
        .mockResolvedValueOnce(mockSetResult)

      const result = await setImageAsCover('salon-uuid', 'new-cover')

      expect(pool.query).toHaveBeenCalledTimes(2)
      
      const firstCall = pool.query.mock.calls[0]
      expect(firstCall[0]).toContain('UPDATE salon_gallery')
      expect(firstCall[0]).toContain('is_cover = false')
      expect(firstCall[1]).toEqual(['salon-uuid'])

      const secondCall = pool.query.mock.calls[1]
      expect(secondCall[0]).toContain('UPDATE salon_gallery')
      expect(secondCall[0]).toContain('is_cover = true')
      expect(secondCall[1]).toEqual(['new-cover'])

      expect(result).toEqual(mockSetResult.rows[0])
    })
  })
})
