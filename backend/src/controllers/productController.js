import { validationResult } from 'express-validator'
import * as Product from '../models/Product.js'
import * as ProductImage from '../models/ProductImage.js'
import * as ProductVariant from '../models/ProductVariant.js'

export const getAllProducts = async (req, res) => {
  try {
    const { categoryId, search, minPrice, maxPrice, isNew, isFeatured, page, limit, sortBy } = req.query

    const products = await Product.findAllProducts({
      categoryId,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      isNew: isNew === 'true' ? true : undefined,
      isFeatured: isFeatured === 'true' ? true : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy: sortBy || 'created_at',
    })

    for (const product of products) {
      product.images = await ProductImage.findImagesByProductId(product.id)
      product.variants = await ProductVariant.findVariantsByProductId(product.id)
    }

    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params
    const product = await Product.findProductById(id)

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    product.images = await ProductImage.findImagesByProductId(product.id)
    product.variants = await ProductVariant.findVariantsByProductId(product.id)

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createProduct = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }

  try {
    const product = await Product.createProduct(req.body)
    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateProduct = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }

  try {
    const { id } = req.params
    const product = await Product.updateProduct(id, req.body)
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteProduct = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }

  try {
    const { id } = req.params
    const product = await Product.deleteProduct(id)
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const uploadProductImage = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }

  try {
    const { id } = req.params
    const { imageUrl, altText, isPrimary } = req.body

    const image = await ProductImage.addImage({
      productId: id,
      imageUrl,
      altText,
      isPrimary,
    })

    res.status(201).json(image)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
