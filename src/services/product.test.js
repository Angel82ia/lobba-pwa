import { describe, it, expect, vi } from 'vitest'
import * as productService from './product'
import apiClient from './api'

vi.mock('./api')

describe('Product Service', () => {
  it('should fetch products', async () => {
    const mockProducts = [{ id: '1', name: 'Test Product' }]
    apiClient.get.mockResolvedValue({ data: mockProducts })

    const result = await productService.getProducts()

    expect(result).toEqual(mockProducts)
    expect(apiClient.get).toHaveBeenCalledWith('/products?')
  })

  it('should fetch product by id', async () => {
    const mockProduct = { id: '1', name: 'Test Product' }
    apiClient.get.mockResolvedValue({ data: mockProduct })

    const result = await productService.getProductById('1')

    expect(result).toEqual(mockProduct)
  })

  it('should fetch categories', async () => {
    const mockCategories = [{ id: '1', name: 'Category 1' }]
    apiClient.get.mockResolvedValue({ data: mockCategories })

    const result = await productService.getCategories()

    expect(result).toEqual(mockCategories)
  })
})
