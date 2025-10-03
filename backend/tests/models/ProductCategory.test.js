import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import pool from '../../src/config/database.js'
import * as ProductCategory from '../../src/models/ProductCategory.js'

describe('ProductCategory Model', () => {
  beforeEach(async () => {
    await pool.query('DELETE FROM product_categories')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createCategory', () => {
    it('should create a category successfully', async () => {
      const categoryData = {
        name: 'Maquillaje',
        slug: 'maquillaje',
        description: 'Productos de maquillaje LOBBA',
        icon: 'makeup-icon',
        sortOrder: 1,
      }

      const category = await ProductCategory.createCategory(categoryData)

      expect(category).toBeDefined()
      expect(category.id).toBeDefined()
      expect(category.name).toBe('Maquillaje')
      expect(category.slug).toBe('maquillaje')
      expect(category.is_active).toBe(true)
    })

    it('should create category with parent', async () => {
      const parent = await ProductCategory.createCategory({
        name: 'Beauty',
        slug: 'beauty',
      })

      const child = await ProductCategory.createCategory({
        name: 'Lipstick',
        slug: 'lipstick',
        parentCategoryId: parent.id,
      })

      expect(child.parent_category_id).toBe(parent.id)
    })
  })

  describe('findAllCategories', () => {
    it('should return all active categories', async () => {
      await ProductCategory.createCategory({ name: 'Cat1', slug: 'cat1' })
      await ProductCategory.createCategory({ name: 'Cat2', slug: 'cat2' })

      const categories = await ProductCategory.findAllCategories()

      expect(categories.length).toBe(2)
    })

    it('should exclude inactive categories by default', async () => {
      const cat1 = await ProductCategory.createCategory({ name: 'Cat1', slug: 'cat1' })
      await ProductCategory.deleteCategory(cat1.id)

      const categories = await ProductCategory.findAllCategories()

      expect(categories.length).toBe(0)
    })

    it('should include inactive categories when requested', async () => {
      const cat1 = await ProductCategory.createCategory({ name: 'Cat1', slug: 'cat1' })
      await ProductCategory.deleteCategory(cat1.id)

      const categories = await ProductCategory.findAllCategories({ includeInactive: true })

      expect(categories.length).toBe(1)
    })
  })

  describe('findCategoryById', () => {
    it('should find category by id', async () => {
      const created = await ProductCategory.createCategory({ name: 'Test', slug: 'test' })
      const found = await ProductCategory.findCategoryById(created.id)

      expect(found.id).toBe(created.id)
      expect(found.name).toBe('Test')
    })

    it('should return undefined for non-existent id', async () => {
      const found = await ProductCategory.findCategoryById('00000000-0000-0000-0000-000000000000')
      expect(found).toBeUndefined()
    })
  })

  describe('findCategoryBySlug', () => {
    it('should find category by slug', async () => {
      await ProductCategory.createCategory({ name: 'Test', slug: 'test-slug' })
      const found = await ProductCategory.findCategoryBySlug('test-slug')

      expect(found.slug).toBe('test-slug')
    })
  })

  describe('updateCategory', () => {
    it('should update category fields', async () => {
      const category = await ProductCategory.createCategory({ name: 'Old', slug: 'old' })
      
      const updated = await ProductCategory.updateCategory(category.id, {
        name: 'New',
        description: 'Updated description',
      })

      expect(updated.name).toBe('New')
      expect(updated.description).toBe('Updated description')
      expect(updated.slug).toBe('old')
    })
  })

  describe('deleteCategory', () => {
    it('should soft delete category', async () => {
      const category = await ProductCategory.createCategory({ name: 'Test', slug: 'test' })
      const deleted = await ProductCategory.deleteCategory(category.id)

      expect(deleted.is_active).toBe(false)
    })
  })
})
