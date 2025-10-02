import { describe, it, expect, beforeEach } from 'vitest'
import pool from '../../src/config/database.js'
import * as Cart from '../../src/models/Cart.js'
import * as Product from '../../src/models/Product.js'
import * as ProductCategory from '../../src/models/ProductCategory.js'
import * as User from '../../src/models/User.js'

describe('Cart Model', () => {
  let testUser
  let testProduct

  beforeEach(async () => {
    await pool.query('DELETE FROM cart_items')
    await pool.query('DELETE FROM carts')
    await pool.query('DELETE FROM products')
    await pool.query('DELETE FROM product_categories')
    await pool.query('DELETE FROM users')

    testUser = await User.createUser({
      email: 'test@example.com',
      passwordHash: 'hash',
      role: 'user',
    })

    const category = await ProductCategory.createCategory({ name: 'Test', slug: 'test' })
    testProduct = await Product.createProduct({
      name: 'Test Product',
      slug: 'test-product',
      categoryId: category.id,
      basePrice: 50,
      stockQuantity: 100,
    })
  })

  describe('findOrCreateCart', () => {
    it('should create new cart for user', async () => {
      const cart = await Cart.findOrCreateCart(testUser.id)

      expect(cart).toBeDefined()
      expect(cart.user_id).toBe(testUser.id)
    })

    it('should return existing cart', async () => {
      const cart1 = await Cart.findOrCreateCart(testUser.id)
      const cart2 = await Cart.findOrCreateCart(testUser.id)

      expect(cart1.id).toBe(cart2.id)
    })
  })

  describe('addItemToCart', () => {
    it('should add item to cart', async () => {
      const cart = await Cart.findOrCreateCart(testUser.id)
      const item = await Cart.addItemToCart({
        cartId: cart.id,
        productId: testProduct.id,
        quantity: 2,
      })

      expect(item).toBeDefined()
      expect(item.quantity).toBe(2)
    })
  })

  describe('getCartWithItems', () => {
    it('should return cart with items', async () => {
      const cart = await Cart.findOrCreateCart(testUser.id)
      await Cart.addItemToCart({
        cartId: cart.id,
        productId: testProduct.id,
        quantity: 2,
      })

      const cartWithItems = await Cart.getCartWithItems(cart.id)

      expect(cartWithItems.items.length).toBe(1)
      expect(cartWithItems.items[0].product_name).toBe('Test Product')
    })
  })

  describe('updateCartItem', () => {
    it('should update item quantity', async () => {
      const cart = await Cart.findOrCreateCart(testUser.id)
      const item = await Cart.addItemToCart({
        cartId: cart.id,
        productId: testProduct.id,
        quantity: 2,
      })

      const updated = await Cart.updateCartItem(item.id, 5)

      expect(updated.quantity).toBe(5)
    })
  })

  describe('removeItemFromCart', () => {
    it('should remove item from cart', async () => {
      const cart = await Cart.findOrCreateCart(testUser.id)
      const item = await Cart.addItemToCart({
        cartId: cart.id,
        productId: testProduct.id,
        quantity: 2,
      })

      await Cart.removeItemFromCart(item.id)

      const cartWithItems = await Cart.getCartWithItems(cart.id)
      expect(cartWithItems.items.length).toBe(0)
    })
  })

  describe('clearCart', () => {
    it('should remove all items from cart', async () => {
      const cart = await Cart.findOrCreateCart(testUser.id)
      await Cart.addItemToCart({
        cartId: cart.id,
        productId: testProduct.id,
        quantity: 2,
      })

      await Cart.clearCart(cart.id)

      const cartWithItems = await Cart.getCartWithItems(cart.id)
      expect(cartWithItems.items.length).toBe(0)
    })
  })
})
