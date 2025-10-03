import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as Product from '../../src/models/Product.js'
import * as ProductImage from '../../src/models/ProductImage.js'
import * as ProductVariant from '../../src/models/ProductVariant.js'
import * as productController from '../../src/controllers/productController.js'

vi.mock('../../src/models/Product.js')
vi.mock('../../src/models/ProductImage.js')
vi.mock('../../src/models/ProductVariant.js')

describe('Product Controller', () => {
  let req, res

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      user: { id: 'user-123', role: 'admin' },
    }
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    }
  })

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      const mockProducts = [{ id: '1', name: 'Test Product' }]
      Product.findAllProducts.mockResolvedValue(mockProducts)
      ProductImage.findImagesByProductId.mockResolvedValue([])
      ProductVariant.findVariantsByProductId.mockResolvedValue([])

      await productController.getAllProducts(req, res)

      expect(res.json).toHaveBeenCalledWith(mockProducts)
    })
  })

  describe('getProductById', () => {
    it('should return product by id', async () => {
      req.params.id = '1'
      const mockProduct = { id: '1', name: 'Test Product' }
      Product.findProductById.mockResolvedValue(mockProduct)
      ProductImage.findImagesByProductId.mockResolvedValue([])
      ProductVariant.findVariantsByProductId.mockResolvedValue([])

      await productController.getProductById(req, res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(mockProduct))
    })

    it('should return 404 if product not found', async () => {
      req.params.id = '1'
      Product.findProductById.mockResolvedValue(null)

      await productController.getProductById(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })
  })

  describe('createProduct', () => {
    it('should create product as admin', async () => {
      req.body = { name: 'New Product', slug: 'new-product', basePrice: 10, stockQuantity: 5 }
      const mockProduct = { id: '1', ...req.body }
      Product.createProduct.mockResolvedValue(mockProduct)

      await productController.createProduct(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockProduct)
    })

    it('should reject if not admin', async () => {
      req.user.role = 'user'

      await productController.createProduct(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })
  })
})
