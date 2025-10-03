import * as AICatalog from '../models/AICatalog.js'
import * as DesignRating from '../models/DesignRating.js'
import * as AIGeneration from '../models/AIGeneration.js'
import logger from '../utils/logger.js'

export const getPublicCatalog = async (req, res) => {
  try {
    const { type, tags, page = 1, limit = 20, sortBy = 'recent' } = req.query

    const tagArray = tags ? tags.split(',').map(t => t.trim()) : undefined

    const items = await AICatalog.findPublicCatalog({
      type,
      tags: tagArray,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy
    })

    res.json(items)
  } catch (error) {
    logger.error('Get public catalog error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getCatalogItemDetail = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    const item = await AICatalog.findCatalogItemById(id)
    if (!item) {
      return res.status(404).json({ message: 'Diseño no encontrado' })
    }

    const ratingStats = await DesignRating.getAverageRating(id)
    const ratingDistribution = await DesignRating.getRatingDistribution(id)
    const userRating = userId ? await DesignRating.findUserRating(id, userId) : null

    res.json({
      ...item,
      ...ratingStats,
      ratingDistribution,
      userRating
    })
  } catch (error) {
    logger.error('Get catalog item error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const rateDesign = async (req, res) => {
  try {
    const { id } = req.params
    const { rating, comment } = req.body
    const userId = req.user.id

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'La calificación debe estar entre 1 y 5' })
    }

    const item = await AICatalog.findCatalogItemById(id)
    if (!item) {
      return res.status(404).json({ message: 'Diseño no encontrado' })
    }

    const existingRating = await DesignRating.findUserRating(id, userId)
    
    let result
    if (existingRating) {
      result = await DesignRating.updateRating(existingRating.id, { rating, comment })
    } else {
      result = await DesignRating.createRating({
        catalogItemId: id,
        userId,
        rating,
        comment
      })
    }

    if (!result) {
      return res.status(400).json({ message: 'Error al calificar el diseño' })
    }

    res.json(result)
  } catch (error) {
    logger.error('Rate design error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getDesignRatings = async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 20 } = req.query

    const ratings = await DesignRating.findRatingsByCatalogItem(id, {
      page: parseInt(page),
      limit: parseInt(limit)
    })

    res.json(ratings)
  } catch (error) {
    logger.error('Get design ratings error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const shareDesignToPublic = async (req, res) => {
  try {
    const { generationId } = req.params
    const userId = req.user.id

    const generation = await AIGeneration.findGenerationById(generationId)
    if (!generation) {
      return res.status(404).json({ message: 'Generación no encontrada' })
    }

    if (generation.user_id !== userId) {
      return res.status(403).json({ message: 'No autorizado para compartir esta generación' })
    }

    const existingCatalogItem = await AICatalog.findCatalogItemByStyleId(generationId)
    if (existingCatalogItem) {
      return res.status(400).json({ message: 'Este diseño ya está en el catálogo público' })
    }

    const catalogItem = await AICatalog.createCatalogItem({
      type: generation.type,
      styleId: generationId,
      name: generation.prompt ? generation.prompt.substring(0, 100) : 'Diseño compartido',
      description: generation.prompt,
      previewImageUrl: generation.output_image_url,
      tags: []
    })

    res.status(201).json(catalogItem)
  } catch (error) {
    logger.error('Share design error:', error)
    res.status(500).json({ message: error.message })
  }
}
