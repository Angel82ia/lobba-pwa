import * as UserAnimation from '../models/UserAnimation.js'
import * as ImageProcessor from '../services/imageProcessorService.js'
import * as CloudStorage from '../services/cloudStorageService.js'
import logger from '../utils/logger.js'

/**
 * GET /api/users/:userId/animation
 * Obtener animación personalizada de un usuario
 */
export const getAnimation = async (req, res) => {
  try {
    const { userId } = req.params

    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para acceder a esta animación'
      })
    }

    const animation = await UserAnimation.findByUserId(userId)

    if (!animation) {
      return res.json({
        success: true,
        data: {
          userId,
          hasCustomAnimation: false
        }
      })
    }

    return res.json({
      success: true,
      data: {
        userId,
        hasCustomAnimation: true,
        animationType: animation.animation_type,
        animationDuration: animation.animation_duration,
        assets: {
          beforeImage: animation.before_image_url,
          afterImage: animation.after_image_url,
          beforeThumbnail: animation.before_image_thumbnail,
          afterThumbnail: animation.after_image_thumbnail,
          videoUrl: animation.animation_video_url
        }
      }
    })

  } catch (error) {
    logger.error('Error getting animation:', error)
    return res.status(500).json({
      success: false,
      error: 'Error al obtener animación'
    })
  }
}

/**
 * POST /api/users/:userId/upload-animation-photos
 * Subir fotos before/after y crear animación
 */
export const uploadPhotos = async (req, res) => {
  try {
    const { userId } = req.params
    const beforePhoto = req.files?.beforePhoto?.[0]
    const afterPhoto = req.files?.afterPhoto?.[0]

    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No autorizado'
      })
    }

    if (!beforePhoto || !afterPhoto) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren ambas fotos (beforePhoto y afterPhoto)'
      })
    }

    const beforeValidation = await ImageProcessor.validateImage(beforePhoto)
    if (!beforeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: `Foto "before" inválida: ${beforeValidation.errors.join(', ')}`
      })
    }

    const afterValidation = await ImageProcessor.validateImage(afterPhoto)
    if (!afterValidation.valid) {
      return res.status(400).json({
        success: false,
        error: `Foto "after" inválida: ${afterValidation.errors.join(', ')}`
      })
    }

    const processedBefore = await ImageProcessor.processImage(beforePhoto)
    const processedAfter = await ImageProcessor.processImage(afterPhoto)

    const paths = CloudStorage.getUserAnimationPaths(userId)

    const beforeUrl = await CloudStorage.upload(
      processedBefore.optimized,
      paths.beforeImage
    )
    const afterUrl = await CloudStorage.upload(
      processedAfter.optimized,
      paths.afterImage
    )
    const beforeThumbUrl = await CloudStorage.upload(
      processedBefore.thumbnail,
      paths.beforeThumbnail
    )
    const afterThumbUrl = await CloudStorage.upload(
      processedAfter.thumbnail,
      paths.afterThumbnail
    )

    const animation = await UserAnimation.upsert(userId, {
      beforeImageUrl: beforeUrl,
      afterImageUrl: afterUrl,
      beforeImageThumbnail: beforeThumbUrl,
      afterImageThumbnail: afterThumbUrl,
      animationType: 'crossfade',
      animationDuration: 2500
    })

    await UserAnimation.setUserAnimationFlag(userId, true)

    logger.info(`Animation created for user ${userId}`)

    return res.json({
      success: true,
      message: 'Animación creada exitosamente',
      data: {
        animationId: animation.id,
        processingStatus: 'completed',
        previewUrl: beforeUrl
      }
    })

  } catch (error) {
    logger.error('Error uploading photos:', error)
    return res.status(500).json({
      success: false,
      error: 'Error al procesar las fotos'
    })
  }
}

/**
 * PUT /api/users/:userId/animation/settings
 * Actualizar configuración de la animación
 */
export const updateSettings = async (req, res) => {
  try {
    const { userId } = req.params
    const { animationType, animationDuration, isEnabled } = req.body

    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No autorizado'
      })
    }

    if (animationDuration && (animationDuration < 1000 || animationDuration > 5000)) {
      return res.status(400).json({
        success: false,
        error: 'La duración debe estar entre 1000 y 5000 ms'
      })
    }

    const allowedTypes = ['crossfade', 'slide', 'fade', 'zoom']
    if (animationType && !allowedTypes.includes(animationType)) {
      return res.status(400).json({
        success: false,
        error: `Tipo de animación inválido. Permitidos: ${allowedTypes.join(', ')}`
      })
    }

    const updated = await UserAnimation.updateSettings(userId, {
      animationType,
      animationDuration,
      isEnabled
    })

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Animación no encontrada'
      })
    }

    return res.json({
      success: true,
      message: 'Configuración actualizada',
      data: updated
    })

  } catch (error) {
    logger.error('Error updating settings:', error)
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar configuración'
    })
  }
}

/**
 * DELETE /api/users/:userId/animation
 * Eliminar animación del usuario
 */
export const deleteAnimation = async (req, res) => {
  try {
    const { userId } = req.params

    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No autorizado'
      })
    }

    await UserAnimation.deactivate(userId)
    await UserAnimation.setUserAnimationFlag(userId, false)

    logger.info(`Animation deactivated for user ${userId}`)

    return res.json({
      success: true,
      message: 'Animación eliminada correctamente'
    })

  } catch (error) {
    logger.error('Error deleting animation:', error)
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar animación'
    })
  }
}
