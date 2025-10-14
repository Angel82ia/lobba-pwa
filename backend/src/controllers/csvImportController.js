import { parseSalonCSV, importSalons } from '../services/csvImportService.js'

export const previewCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const csvText = req.file.buffer.toString('utf-8')
    const results = parseSalonCSV(csvText)

    return res.status(200).json({
      success: true,
      preview: {
        validCount: results.valid.length,
        invalidCount: results.invalid.length,
        validSample: results.valid.slice(0, 10),
        invalidSample: results.invalid.slice(0, 10)
      }
    })
  } catch (error) {
    console.error('Error previewing CSV:', error)
    return res.status(500).json({ error: error.message })
  }
}

export const processImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const csvText = req.file.buffer.toString('utf-8')
    const parsed = parseSalonCSV(csvText)

    if (parsed.invalid.length > 0) {
      return res.status(400).json({ 
        error: 'CSV contains invalid rows',
        invalid: parsed.invalid
      })
    }

    const results = await importSalons(parsed.valid, req.user.userId)

    return res.status(200).json({
      success: true,
      results
    })
  } catch (error) {
    console.error('Error importing CSV:', error)
    return res.status(500).json({ error: error.message })
  }
}

export const downloadTemplate = (req, res) => {
  const template = `business_name,address,city,postal_code,latitude,longitude,phone,email,website,accepts_reservations
Salón Belleza Madrid,Calle Gran Vía 1,Madrid,28013,40.4168,-3.7038,+34912345678,salon@example.com,https://salon.com,true`

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=salon_import_template.csv')
  return res.status(200).send(template)
}
