import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOAD_BASE_DIR = path.join(__dirname, '../../uploads')

const BASE_URL = process.env.UPLOAD_BASE_URL || 'http://localhost:3000/uploads'

/**
 * Asegurar que un directorio existe
 */
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

/**
 * Subir archivo al almacenamiento local
 * @param {Buffer} buffer - Contenido del archivo
 * @param {string} relativePath - Ruta relativa (ej: 'users/123/animations/before.webp')
 * @returns {Promise<string>} - URL pública del archivo
 */
export const upload = async (buffer, relativePath) => {
  try {
    const fullPath = path.join(UPLOAD_BASE_DIR, relativePath)
    const directory = path.dirname(fullPath)

    await ensureDirectoryExists(directory)

    await fs.writeFile(fullPath, buffer)

    const publicUrl = `${BASE_URL}/${relativePath}`
    return publicUrl

  } catch (error) {
    throw new Error(`Error subiendo archivo: ${error.message}`)
  }
}

/**
 * Eliminar archivo del almacenamiento
 * @param {string} relativePath - Ruta relativa del archivo
 * @returns {Promise<boolean>} - True si se eliminó exitosamente
 */
export const deleteFile = async (relativePath) => {
  try {
    const fullPath = path.join(UPLOAD_BASE_DIR, relativePath)
    await fs.unlink(fullPath)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') {
      return true
    }
    throw new Error(`Error eliminando archivo: ${error.message}`)
  }
}

/**
 * Verificar si un archivo existe
 * @param {string} relativePath - Ruta relativa del archivo
 * @returns {Promise<boolean>}
 */
export const fileExists = async (relativePath) => {
  try {
    const fullPath = path.join(UPLOAD_BASE_DIR, relativePath)
    await fs.access(fullPath)
    return true
  } catch {
    return false
  }
}

/**
 * Obtener tamaño de archivo
 * @param {string} relativePath - Ruta relativa del archivo
 * @returns {Promise<number>} - Tamaño en bytes
 */
export const getFileSize = async (relativePath) => {
  try {
    const fullPath = path.join(UPLOAD_BASE_DIR, relativePath)
    const stats = await fs.stat(fullPath)
    return stats.size
  } catch (error) {
    throw new Error(`Error obteniendo tamaño: ${error.message}`)
  }
}

/**
 * Eliminar directorio completo de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>}
 */
export const deleteUserAnimationDirectory = async (userId) => {
  try {
    const userDir = path.join(UPLOAD_BASE_DIR, `users/${userId}/animations`)
    await fs.rm(userDir, { recursive: true, force: true })
    return true
  } catch (error) {
    if (error.code === 'ENOENT') {
      return true
    }
    throw new Error(`Error eliminando directorio: ${error.message}`)
  }
}

/**
 * Inicializar directorio de uploads
 * Debe ser llamado al iniciar el servidor
 */
export const initialize = async () => {
  try {
    await ensureDirectoryExists(UPLOAD_BASE_DIR)
    console.log(`✅ Upload directory initialized: ${UPLOAD_BASE_DIR}`)
  } catch (error) {
    console.error(`❌ Error initializing upload directory: ${error.message}`)
    throw error
  }
}

/**
 * Generar rutas para archivos de animación de usuario
 * @param {string} userId - ID del usuario
 * @returns {Object} - Objeto con rutas para cada archivo
 */
export const getUserAnimationPaths = (userId) => {
  return {
    beforeImage: `users/${userId}/animations/before.webp`,
    afterImage: `users/${userId}/animations/after.webp`,
    beforeThumbnail: `users/${userId}/animations/before_thumb.webp`,
    afterThumbnail: `users/${userId}/animations/after_thumb.webp`,
    video: `users/${userId}/animations/animation.mp4`
  }
}

/*
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

export const upload = async (buffer, key) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp'
  })
  
  await s3Client.send(command)
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
}
*/
