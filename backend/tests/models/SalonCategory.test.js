import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import pool from '../../src/config/database.js'
import {
  createCategory,
  findAllCategories,
  findCategoryById,
  findCategoryBySlug,
  updateCategory,
  deleteCategory,
  assignCategoryToSalon,
  removeCategoryFromSalon,
  getSalonCategories,
} from '../../src/models/SalonCategory.js'

vi.mock('../../src/config/database.js')

describe('SalonCategory Model', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const mockResult = {
        rows: [{
          id: 'cat-uuid',
          name: 'Belleza',
          slug: 'belleza',
          description: 'Servicios de belleza',
          icon: 'sparkles',
          parent_category_id: null,
          is_active: true,
          sort_order: 1,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const categoryData = {
        name: 'Belleza',
        slug: 'belleza',
        description: 'Servicios de belleza',
        icon: 'sparkles',
        sortOrder: 1,
      }

      const result = await createCategory(categoryData)

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['Belleza', 'belleza', 'Servicios de belleza', 'sparkles', null, 1])
      )
      expect(result).toEqual(mockResult.rows[0])
    })

    it('should create a subcategory with parent', async () => {
      const mockResult = {
        rows: [{
          id: 'subcat-uuid',
          name: 'Corte Mujer',
          slug: 'corte-mujer',
          parent_category_id: 'parent-uuid',
          is_active: true,
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const categoryData = {
        name: 'Corte Mujer',
        slug: 'corte-mujer',
        parentCategoryId: 'parent-uuid',
      }

      const result = await createCategory(categoryData)

      expect(pool.query).toHaveBeenCalled()
      const callArgs = pool.query.mock.calls[0][1]
      expect(callArgs).toContain('parent-uuid')
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('findAllCategories', () => {
    it('should return all active categories', async () => {
      const mockResult = {
        rows: [
          { id: 'cat-1', name: 'Belleza', is_active: true },
          { id: 'cat-2', name: 'Peluquería', is_active: true },
        ],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await findAllCategories()

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        []
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('SELECT')
      expect(sqlQuery).toContain('salon_categories')
      expect(sqlQuery).toContain('is_active = true')
      expect(result).toEqual(mockResult.rows)
    })

    it('should return all categories including inactive when specified', async () => {
      const mockResult = {
        rows: [
          { id: 'cat-1', name: 'Belleza', is_active: true },
          { id: 'cat-2', name: 'Cerrado', is_active: false },
        ],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await findAllCategories({ includeInactive: true })

      expect(pool.query).toHaveBeenCalled()
      expect(result).toEqual(mockResult.rows)
    })
  })

  describe('findCategoryById', () => {
    it('should find category by ID', async () => {
      const mockResult = {
        rows: [{
          id: 'cat-uuid',
          name: 'Belleza',
          slug: 'belleza',
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await findCategoryById('cat-uuid')

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['cat-uuid']
      )
      expect(result).toEqual(mockResult.rows[0])
    })

    it('should return undefined when category not found', async () => {
      const mockResult = { rows: [] }
      pool.query.mockResolvedValue(mockResult)

      const result = await findCategoryById('nonexistent')

      expect(result).toBeUndefined()
    })
  })

  describe('findCategoryBySlug', () => {
    it('should find category by slug', async () => {
      const mockResult = {
        rows: [{
          id: 'cat-uuid',
          name: 'Belleza',
          slug: 'belleza',
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await findCategoryBySlug('belleza')

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['belleza']
      )
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('updateCategory', () => {
    it('should update category', async () => {
      const mockResult = {
        rows: [{
          id: 'cat-uuid',
          name: 'Belleza Actualizada',
          description: 'Nueva descripción',
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const updates = {
        name: 'Belleza Actualizada',
        description: 'Nueva descripción',
      }

      const result = await updateCategory('cat-uuid', updates)

      expect(pool.query).toHaveBeenCalled()
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('UPDATE salon_categories')
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('deleteCategory', () => {
    it('should soft delete category', async () => {
      const mockResult = {
        rows: [{
          id: 'cat-uuid',
          is_active: false,
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await deleteCategory('cat-uuid')

      expect(pool.query).toHaveBeenCalled()
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('UPDATE salon_categories')
      expect(sqlQuery).toContain('is_active = false')
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('assignCategoryToSalon', () => {
    it('should assign category to salon', async () => {
      const mockResult = {
        rows: [{
          id: 'assignment-uuid',
          salon_profile_id: 'salon-uuid',
          category_id: 'cat-uuid',
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await assignCategoryToSalon('salon-uuid', 'cat-uuid')

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['salon-uuid', 'cat-uuid']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('INSERT INTO salon_category_assignments')
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('removeCategoryFromSalon', () => {
    it('should remove category from salon', async () => {
      const mockResult = {
        rows: [{
          id: 'assignment-uuid',
        }],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await removeCategoryFromSalon('salon-uuid', 'cat-uuid')

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['salon-uuid', 'cat-uuid']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('DELETE FROM salon_category_assignments')
      expect(result).toEqual(mockResult.rows[0])
    })
  })

  describe('getSalonCategories', () => {
    it('should get all categories for a salon', async () => {
      const mockResult = {
        rows: [
          {
            id: 'cat-1',
            name: 'Belleza',
            slug: 'belleza',
          },
          {
            id: 'cat-2',
            name: 'Peluquería',
            slug: 'peluqueria',
          },
        ],
      }

      pool.query.mockResolvedValue(mockResult)

      const result = await getSalonCategories('salon-uuid')

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['salon-uuid']
      )
      const sqlQuery = pool.query.mock.calls[0][0]
      expect(sqlQuery).toContain('JOIN salon_category_assignments')
      expect(result).toEqual(mockResult.rows)
    })
  })
})
