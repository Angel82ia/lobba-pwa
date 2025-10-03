import * as Wishlist from '../models/Wishlist.js'

export const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.getUserWishlist(req.user.id)
    res.json(wishlist)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body
    const item = await Wishlist.addToWishlist(req.user.id, productId)
    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params
    await Wishlist.removeFromWishlist(req.user.id, productId)
    res.json({ message: 'Removed from wishlist' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
