import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import pool from '../../src/config/database.js'
import * as Product from '../../src/models/Product.js'
import * as ProductCategory from '../../src/models/ProductCategory.js'

describe('Product Model', () => {
  let testCategory

  beforeEach(async () => {
    await pool.query('DELETE FROM products')
    await pool.query('DELETE FROM product_categories')
    testCategory = await ProductCategory.createCategory({
      name: 'Test Category',
      slug: 'test-category',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const productData = {
        name: 'LOBBA Lipstick',
        slug: 'lobba-lipstick',
        description: 'Beautiful red lipstick',
        categoryId: testCategory.id,
        basePrice: 24.99,
        stockQuantity: 100,
        isNew: true,
      }

      const product = await Product.createProduct(productData)

      expect(product).toBeDefined()
      expect(product.id).toBeDefined()
      expect(product.name).toBe('LOBBA Lipstick')
      expect(product.brand).toBe('LOBBA')
      expect(product.base_price).toBe('24.99')
      expect(product.is_new).toBe(true)
    })

    it('should create product with discount', async () => {
      const product = await Product.createProduct({
        name: 'Sale Item',
        slug: 'sale-item',
        categoryId: testCategory.id,
        basePrice: 50.00,
        discountPercentage: 20,
        stockQuantity: 10,
      })

      expect(product.discount_percentage).toBe('20.00')
    })
  })

  describe('findAllProducts', () => {
    it('should return all active products', async () => {
      await Product.createProduct({
        name: 'Product 1',
        slug: 'product-1',
        categoryId: testCategory.id,
        basePrice: 10,
        stockQuantity: 5,
      })
      await Product.createProduct({
        name: 'Product 2',
        slug: 'product-2',
        categoryId: testCategory.id,
        basePrice: 20,
        stockQuantity: 5,
      })

      const products = await Product.findAllProducts({})

      expect(products.length).toBe(2)
    })

    it('should filter by category', async () => {
      const cat2 = await ProductCategory.createCategory({ name: 'Cat2', slug: 'cat2' })
      
      await Product.createProduct({
        name: 'Product 1',
        slug: 'product-1',
        categoryId: testCategory.id,
        basePrice: 10,
        stockQuantity: 5,
      })
      await Product.createProduct({
        name: 'Product 2',
        slug: 'product-2',
        categoryId: cat2.id,
        basePrice: 20,
        stockQuantity: 5,
      })

      const products = await Product.findAllProducts({ categoryId: testCategory.id })

      expect(products.length).toBe(1)
      expect(products[0].name).toBe('Product 1')
    })

    it('should filter by price range', async () => {
      await Product.createProduct({
        name: 'Cheap',
        slug: 'cheap',
        categoryId: testCategory.id,
        basePrice: 10,
        stockQuantity: 5,
      })
      await Product.createProduct({
        name: 'Expensive',
        slug: 'expensive',
        categoryId: testCategory.id,
        basePrice: 100,
        stockQuantity: 5,
      })

      const products = await Product.findAllProducts({ minPrice: 50, maxPrice: 150 })

      expect(products.length).toBe(1)
      expect(products[0].name).toBe('Expensive')
    })

    it('should filter by isNew flag', async () => {
      await Product.createProduct({
        name: 'Old Product',
        slug: 'old',
        categoryId: testCategory.id,
        basePrice: 10,
        stockQuantity: 5,
        isNew: false,
      })
      await Product.createProduct({
        name: 'New Product',
        slug: 'new',
        categoryId: testCategory.id,
        basePrice: 10,
        stockQuantity: 5,
        isNew: true,
      })

      const products = await Product.findAllProducts({ isNew: true })

      expect(products.length).toBe(1)
      expect(products[0].name).toBe('New Product')
    })

    it('should paginate results', async () => {
      for (let i = 1; i <= 15; i++) {
        await Product.createProduct({
          name: `Product ${i}`,
          slug: `product-${i}`,
          categoryId: testCategory.id,
          basePrice: 10,
          stockQuantity: 5,
        })
      }

      const page1 = await Product.findAllProducts({ page: 1, limit: 10 })
      const page2 = await Product.findAllProducts({ page: 2, limit: 10 })

      expect(page1.length).toBe(10)
      expect(page2.length).toBe(5)
    })
  })

  describe('findProductById', () => {
    it('should find product by id', async () => {
      const created = await Product.createProduct({
        name: 'Test',
        slug: 'test',
        categoryId: testCategory.id,
        basePrice: 10,
        stockQuantity: 5,
      })
      const found = await Product.findProductById(created.id)

      expect(found.id).toBe(created.id)
    })
  })

  describe('findProductBySlug', () => {
    it('should find product by slug', async () => {
      await Product.createProduct({
        name: 'Test',
        slug: 'test-slug',
        categoryId: testCategory.id,
        basePrice: 10,
        stockQuantity: 5,
      })
      const found = await Product.findProductBySlug('test-slug')

      expect(found.slug).toBe('test-slug')
    })
  })

  describe('updateProduct', () => {
    it('should update product fields', async () => {
      const product = await Product.createProduct({
        name: 'Old',
        slug: 'old',
        categoryId: testCategory.id,
        basePrice: 10,
        stockQuantity: 5,
      })
      
      const updated = await Product.updateProduct(product.id, {
        name: 'New',
        basePrice: 20,
      })

      expect(updated.name).toBe('New')
      expect(updated.base_price).toBe('20.00')
    })
  })

  describe('deleteProduct', () => {
    it('should soft delete product', async () => {
      const product = await Product.createProduct({
        name: 'Test',
        slug: 'test',
        categoryId: testCategory.id,
        basePrice: 10,
        stockQuantity: 5,
      })
      const deleted = await Product.deleteProduct(product.id)

      expect(deleted.is_active).toBe(false)
    })
  })

  describe('updateStock', () => {
    it('should update product stock', async () => {
      const product = await Product.createProduct({
        name: 'Test',
        slug: 'test',
        categoryId: testCategory.id,
        basePrice: 10,
        stockQuantity: 100,
      })
      
      const updated = await Product.updateStock(product.id, 150)

      expect(updated.stock_quantity).toBe(150)
    })
  })
})
