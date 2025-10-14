import express from 'express'
import multer from 'multer'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { previewCSV, processImport, downloadTemplate } from '../controllers/csvImportController.js'

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      return cb(new Error('Only CSV files allowed'))
    }
    cb(null, true)
  }
})

router.post('/preview', requireAuth, requireRole(['admin']), upload.single('file'), previewCSV)
router.post('/process', requireAuth, requireRole(['admin']), upload.single('file'), processImport)
router.get('/template', downloadTemplate)

export default router
