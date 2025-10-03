import { describe, it, expect, beforeEach } from 'vitest'
import pool from '../../src/config/database.js'
import * as ProductVariant from '../../src/models/ProductVariant.js'
import * as Product from '../../src/models/Product.js'
import * as ProductCategory from '../../src/models/ProductCategory.js'

describe('ProductVariant Model', () => {
  let testProduct

  beforeEach(async () => {
    await pool.query('DELETE FROM product_variants')
    await pool.query('DELETE FROM products')
    await pool.query('DELETE FROM product_categories')
    
    const category = await ProductCategory.createCategory({ name: 'Test', slug: 'test' })
    testProduct = await Product.createProduct({
      name: 'Test Product',
      slug: 'test-product',
      categoryId: category.id,
      basePrice: 50,
      stockQuantity: 10,
    })
  })

  describe('createVariant', () => {
    it('should create a variant successfully', async () => {
      const variant = await ProductVariant.createVariant({
        productId: testProduct.id,
        sku: 'LOBBA-TST-RED',
        name: 'Red',
        color: 'red',
        stockQuantity: 5,
      })

      expect(variant).toBeDefined()
      expect(variant.id).toBeDefined()
      expect(variant.color).toBe('red')
    })
  })

  describe('findVariantsByProductId', () => {
    it('should return all variants for a product', async () => {
      await ProductVariant.createVariant({
        productId: testProduct.id,
        sku: 'SKU1',
        name: 'Variant 1',
        stockQuantity: 5,
      })
      await ProductVariant.createVariant({
        productId: testProduct.id,
        sku: 'SKU2',
        name: 'Variant 2',
        stockQuantity: 5,
      })

      const variants = await ProductVariant.findVariantsByProductId(testProduct.id)

      expect(variants.length).toBe(2)
    })
  })

  describe('updateVariant', () => {
    it('should update variant fields', async () => {
      const variant = await ProductVariant.createVariant({
        productId: testProduct.id,
        sku: 'SKU1',
        name: 'Old',
        stockQuantity: 5,
      })

      const updated = await ProductVariant.updateVariant(variant.id, {
        name: 'New',
        stockQuantity: 10,
      })

      expect(updated.name).toBe('New')
      expect(updated.stock_quantity).toBe(10)
    })
  })

  describe('deleteVariant', () => {
    it('should soft delete variant', async () => {
      const variant = await ProductVariant.createVariant({
        productId: testProduct.id,
        sku: 'SKU1',
        name: 'Test',
        stockQuantity: 5,
      })

      const deleted = await ProductVariant.deleteVariant(variant.id)

      expect(deleted.is_active).toBe(false)
    })
  })
})
