import express from 'express'
import multer from 'multer'
import { authenticate } from '../middleware/auth.js'
import * as animationController from '../controllers/animationController.js'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo JPEG, PNG, WebP'))
    }
  }
})

router.get(
  '/users/:userId/animation',
  authenticate,
  animationController.getAnimation
)

router.post(
  '/users/:userId/upload-animation-photos',
  authenticate,
  upload.fields([
    { name: 'beforePhoto', maxCount: 1 },
    { name: 'afterPhoto', maxCount: 1 }
  ]),
  animationController.uploadPhotos
)

router.put(
  '/users/:userId/animation/settings',
  authenticate,
  animationController.updateSettings
)

router.delete(
  '/users/:userId/animation',
  authenticate,
  animationController.deleteAnimation
)

export default router
