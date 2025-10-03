import * as Banner from '../models/Banner.js'

export const createBanner = async (req, res) => {
  try {
    const { title, content, type, imageUrl, priority, startDate, endDate } = req.body
    const createdBy = req.user.id

    if (!title || !content || !type) {
      return res.status(400).json({ message: 'Título, contenido y tipo son requeridos' })
    }

    if (!['announcement', 'news', 'promotion'].includes(type)) {
      return res.status(400).json({ message: 'Tipo de banner inválido' })
    }

    const banner = await Banner.createBanner({
      title,
      content,
      type,
      imageUrl: imageUrl || null,
      priority: priority || 0,
      startDate: startDate || null,
      endDate: endDate || null,
      createdBy
    })

    res.status(201).json(banner)
  } catch (error) {
    console.error('Create banner error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.findActiveBanners()
    res.json(banners)
  } catch (error) {
    console.error('Get active banners error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getAllBanners = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const banners = await Banner.findAllBanners({
      page: parseInt(page),
      limit: parseInt(limit)
    })
    res.json(banners)
  } catch (error) {
    console.error('Get all banners error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getBannerById = async (req, res) => {
  try {
    const { id } = req.params
    const banner = await Banner.findBannerById(id)
    
    if (!banner) {
      return res.status(404).json({ message: 'Banner no encontrado' })
    }

    res.json(banner)
  } catch (error) {
    console.error('Get banner error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const banner = await Banner.findBannerById(id)
    if (!banner) {
      return res.status(404).json({ message: 'Banner no encontrado' })
    }

    const updatedBanner = await Banner.updateBanner(id, updates)
    res.json(updatedBanner)
  } catch (error) {
    console.error('Update banner error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params

    const banner = await Banner.findBannerById(id)
    if (!banner) {
      return res.status(404).json({ message: 'Banner no encontrado' })
    }

    await Banner.deleteBanner(id)
    res.json({ message: 'Banner eliminado correctamente' })
  } catch (error) {
    console.error('Delete banner error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const toggleBannerActive = async (req, res) => {
  try {
    const { id } = req.params

    const banner = await Banner.toggleBannerActive(id)
    if (!banner) {
      return res.status(404).json({ message: 'Banner no encontrado' })
    }

    res.json(banner)
  } catch (error) {
    console.error('Toggle banner error:', error)
    res.status(500).json({ message: error.message })
  }
}
