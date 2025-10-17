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
    // Limpiar todos los mocks antes de cada test
    vi.clearAllMocks()

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
    it('should return product by id (UUID)', async () => {
      // Usar un UUID válido
      const productId = '123e4567-e89b-12d3-a456-426614174000'
      req.params.id = productId
      const mockProduct = { id: productId, name: 'Test Product' }
      Product.findProductById.mockResolvedValue(mockProduct)
      ProductImage.findImagesByProductId.mockResolvedValue([])
      ProductVariant.findVariantsByProductId.mockResolvedValue([])

      await productController.getProductById(req, res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(mockProduct))
    })

    it('should return product by slug', async () => {
      req.params.id = 'test-product-slug'
      const mockProduct = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'test-product-slug',
        name: 'Test Product',
      }
      Product.findProductBySlug.mockResolvedValue(mockProduct)
      ProductImage.findImagesByProductId.mockResolvedValue([])
      ProductVariant.findVariantsByProductId.mockResolvedValue([])

      await productController.getProductById(req, res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(mockProduct))
    })

    it('should return 404 if product not found', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000'
      req.params.id = productId
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
