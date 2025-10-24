import sharp from 'sharp'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MIN_DIMENSIONS = 500 // 500x500px mínimo
const MAX_WIDTH = 1000
const MAX_HEIGHT = 1000
const THUMBNAIL_SIZE = 300

/**
 * Validar imagen (tipo, tamaño, dimensiones)
 */
export const validateImage = async (file) => {
  const errors = []

  if (file.size > MAX_FILE_SIZE) {
    errors.push(`El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedMimes.includes(file.mimetype)) {
    errors.push('Tipo de archivo no permitido. Solo JPEG, PNG, WebP')
  }

  try {
    const metadata = await sharp(file.buffer).metadata()

    if (metadata.width < MIN_DIMENSIONS || metadata.height < MIN_DIMENSIONS) {
      errors.push(`La imagen debe tener al menos ${MIN_DIMENSIONS}x${MIN_DIMENSIONS}px`)
    }

  } catch (error) {
    errors.push('El archivo no es una imagen válida')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Optimizar imagen a WebP
 */
export const optimize = async (fileBuffer, options = {}) => {
  const {
    maxWidth = MAX_WIDTH,
    maxHeight = MAX_HEIGHT,
    quality = 85,
    format = 'webp'
  } = options

  try {
    const processed = await sharp(fileBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFormat(format, { quality })
      .toBuffer()

    return processed

  } catch (error) {
    throw new Error(`Error optimizando imagen: ${error.message}`)
  }
}

/**
 * Crear thumbnail cuadrado
 */
export const createThumbnail = async (fileBuffer, options = {}) => {
  const {
    width = THUMBNAIL_SIZE,
    height = THUMBNAIL_SIZE,
    quality = 80
  } = options

  try {
    const thumbnail = await sharp(fileBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .toFormat('webp', { quality })
      .toBuffer()

    return thumbnail

  } catch (error) {
    throw new Error(`Error creando thumbnail: ${error.message}`)
  }
}

/**
 * Obtener información de la imagen
 */
export const getImageInfo = async (fileBuffer) => {
  try {
    const metadata = await sharp(fileBuffer).metadata()

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation
    }

  } catch (error) {
    throw new Error(`Error obteniendo info de imagen: ${error.message}`)
  }
}

/**
 * Detectar si la imagen contiene un rostro
 * (Placeholder para futura implementación con face-api.js o similar)
 */
export const detectFace = async (fileBuffer) => {
  
  return true
}

/**
 * Procesar imagen completa (validar + optimizar + thumbnail)
 */
export const processImage = async (file) => {
  const validation = await validateImage(file)
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '))
  }

  const optimized = await optimize(file.buffer, {
    maxWidth: MAX_WIDTH,
    maxHeight: MAX_HEIGHT,
    quality: 85,
    format: 'webp'
  })

  const thumbnail = await createThumbnail(file.buffer, {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    quality: 80
  })

  return {
    optimized,
    thumbnail,
    info: await getImageInfo(file.buffer)
  }
}
