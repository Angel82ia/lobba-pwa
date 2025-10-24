import * as UserQuota from '../models/UserQuota.js'
import * as AIGeneration from '../models/AIGeneration.js'
import * as AICatalog from '../models/AICatalog.js'
import * as SavedDesign from '../models/SavedDesign.js'
import { generateNailDesign, generateHairstyleTryOn } from '../utils/aiService.js'
import logger from '../utils/logger.js'
import { uploadToCloudinary } from '../utils/cloudinary.js'
import { consumeARCredits, getARCreditsInfo } from '../middleware/arCredits.js'

export const generateNails = async (req, res) => {
  try {
    const { prompt } = req.body
    const userId = req.user.id

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ message: 'Prompt es requerido' })
    }


    const result = await generateNailDesign(prompt)

    let savedImageUrl = result.imageUrl
    
    if (result.imageUrl.startsWith('data:image')) {
      const base64Data = result.imageUrl.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      
      const cloudinaryResult = await uploadToCloudinary(
        { buffer },
        'lobba/ai-generations/nails'
      )
      
      savedImageUrl = cloudinaryResult.secure_url
    }

    const generation = await AIGeneration.createGeneration({
      userId,
      type: 'nails',
      prompt,
      inputImageUrl: null,
      outputImageUrl: savedImageUrl,
      styleId: null,
      aiProvider: result.provider,
      generationTimeMs: result.generationTimeMs
    })

    const arResult = await consumeARCredits(req, {
      prompt,
      generation_id: generation.id,
      provider: result.provider
    })

    await SavedDesign.createSavedDesign({
      userId,
      generationId: generation.id,
      title: prompt.substring(0, 100)
    })

    const arCreditsInfo = await getARCreditsInfo(userId)

    res.json({
      generation,
      ar_credits: arCreditsInfo
    })
  } catch (error) {
    logger.error('Generate nails error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const generateHairstyle = async (req, res) => {
  try {
    const { selfieBase64, styleId } = req.body
    const userId = req.user.id

    if (!selfieBase64 || !styleId) {
      return res.status(400).json({ message: 'Selfie y estilo son requeridos' })
    }

    const result = await generateHairstyleTryOn(selfieBase64, styleId)

    let savedInputUrl = selfieBase64
    let savedOutputUrl = result.imageUrl
    
    if (selfieBase64.startsWith('data:image')) {
      const inputBase64 = selfieBase64.replace(/^data:image\/\w+;base64,/, '')
      const inputBuffer = Buffer.from(inputBase64, 'base64')
      
      const inputCloudinaryResult = await uploadToCloudinary(
        { buffer: inputBuffer },
        'lobba/ai-generations/hairstyle-inputs'
      )
      
      savedInputUrl = inputCloudinaryResult.secure_url
    }
    
    if (result.imageUrl.startsWith('data:image')) {
      const outputBase64 = result.imageUrl.replace(/^data:image\/\w+;base64,/, '')
      const outputBuffer = Buffer.from(outputBase64, 'base64')
      
      const outputCloudinaryResult = await uploadToCloudinary(
        { buffer: outputBuffer },
        'lobba/ai-generations/hairstyle-outputs'
      )
      
      savedOutputUrl = outputCloudinaryResult.secure_url
    }

    const generation = await AIGeneration.createGeneration({
      userId,
      type: 'hairstyle',
      prompt: null,
      inputImageUrl: savedInputUrl,
      outputImageUrl: savedOutputUrl,
      styleId,
      aiProvider: result.provider,
      generationTimeMs: result.generationTimeMs
    })

    const arResult = await consumeARCredits(req, {
      style_id: styleId,
      generation_id: generation.id,
      provider: result.provider
    })

    await SavedDesign.createSavedDesign({
      userId,
      generationId: generation.id,
      title: `Peinado ${styleId}`
    })

    const arCreditsInfo = await getARCreditsInfo(userId)

    res.json({
      generation,
      ar_credits: arCreditsInfo
    })
  } catch (error) {
    logger.error('Generate hairstyle error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const generateMakeup = async (req, res) => {
  try {
    const { selfieBase64, makeupPresetId, customization } = req.body
    const userId = req.user.id

    if (!selfieBase64 || !makeupPresetId) {
      return res.status(400).json({ message: 'Selfie y preset de maquillaje son requeridos' })
    }

    const result = {
      imageUrl: selfieBase64,
      provider: 'banuba',
      generationTimeMs: 1500
    }

    let savedInputUrl = selfieBase64
    let savedOutputUrl = result.imageUrl
    
    if (selfieBase64.startsWith('data:image')) {
      const inputBase64 = selfieBase64.replace(/^data:image\/\w+;base64,/, '')
      const inputBuffer = Buffer.from(inputBase64, 'base64')
      
      const inputCloudinaryResult = await uploadToCloudinary(
        { buffer: inputBuffer },
        'lobba/ai-generations/makeup-inputs'
      )
      
      savedInputUrl = inputCloudinaryResult.secure_url
      savedOutputUrl = inputCloudinaryResult.secure_url
    }

    const generation = await AIGeneration.createGeneration({
      userId,
      type: 'makeup',
      prompt: null,
      inputImageUrl: savedInputUrl,
      outputImageUrl: savedOutputUrl,
      styleId: makeupPresetId,
      aiProvider: result.provider,
      generationTimeMs: result.generationTimeMs
    })

    const arResult = await consumeARCredits(req, {
      makeup_preset_id: makeupPresetId,
      customization: customization || {},
      generation_id: generation.id,
      provider: result.provider
    })

    await SavedDesign.createSavedDesign({
      userId,
      generationId: generation.id,
      title: `Maquillaje ${makeupPresetId}`
    })

    const arCreditsInfo = await getARCreditsInfo(userId)

    res.json({
      generation,
      ar_credits: arCreditsInfo
    })
  } catch (error) {
    logger.error('Generate makeup error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getCatalog = async (req, res) => {
  try {
    const { type, tags, page = 1, limit = 20 } = req.query

    const items = await AICatalog.findCatalogItems({
      type,
      tags: tags ? tags.split(',') : undefined,
      page: parseInt(page),
      limit: parseInt(limit)
    })

    res.json(items)
  } catch (error) {
    logger.error('Get catalog error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getMyDesigns = async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 20 } = req.query

    const designs = await SavedDesign.findSavedDesignsByUserId(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    })

    res.json(designs)
  } catch (error) {
    logger.error('Get my designs error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getMyFavorites = async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 20 } = req.query

    const favorites = await SavedDesign.findFavoriteDesignsByUserId(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    })

    res.json(favorites)
  } catch (error) {
    logger.error('Get favorites error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const toggleFavoriteDesign = async (req, res) => {
  try {
    const { id } = req.params

    const design = await SavedDesign.toggleFavorite(id)
    if (!design) {
      return res.status(404).json({ message: 'Diseño no encontrado' })
    }

    res.json(design)
  } catch (error) {
    logger.error('Toggle favorite error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getQuota = async (req, res) => {
  try {
    const userId = req.user.id
    
    const arCreditsInfo = await getARCreditsInfo(userId)

    res.json({
      ar_credits: arCreditsInfo,
      legacy_note: 'Sistema actualizado a créditos AR unificados (50/mes para uñas, peinados y maquillaje)'
    })
  } catch (error) {
    logger.error('Get quota error:', error)
    res.status(500).json({ message: error.message })
  }
}
