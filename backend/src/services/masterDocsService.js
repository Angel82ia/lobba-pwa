import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MASTER_DOCS_PATH = path.join(__dirname, '../../master_docs')

/**
 * Lee todos los archivos markdown de una categoría
 */
async function readCategoryDocs(category) {
  const categoryPath = path.join(MASTER_DOCS_PATH, category)
  
  try {
    const files = await fs.readdir(categoryPath)
    const mdFiles = files.filter(f => f.endsWith('.md'))
    
    const contents = await Promise.all(
      mdFiles.map(async file => {
        const filePath = path.join(categoryPath, file)
        const content = await fs.readFile(filePath, 'utf-8')
        return `\n### ${file.replace('.md', '')}\n${content}`
      })
    )
    
    return contents.join('\n\n')
  } catch (error) {
    console.error(`Error reading category ${category}:`, error.message)
    return ''
  }
}

/**
 * Compila todo el Documento Maestro en un solo string
 */
export async function compileMasterDocument() {
  const categories = [
    'marca',
    'ecommerce',
    'servicios_ia',
    'equipos',
    'membresias',
    'marketplace',
    'faqs'
  ]
  
  const sections = await Promise.all(
    categories.map(async category => {
      const content = await readCategoryDocs(category)
      return `\n## ${category.toUpperCase()}\n${content}`
    })
  )
  
  const masterDoc = `# DOCUMENTO MAESTRO LOBBA

Este documento contiene toda la información sobre LOBBA que Olivia puede consultar para responder preguntas.

${sections.join('\n\n')}
`
  
  return masterDoc
}

/**
 * Busca información específica en el Documento Maestro
 */
export async function searchMasterDocument(query) {
  const masterDoc = await compileMasterDocument()
  const lowerQuery = query.toLowerCase()
  
  const lines = masterDoc.split('\n')
  const relevantSections = []
  let currentSection = []
  let isRelevant = false
  
  for (const line of lines) {
    if (line.startsWith('##')) {
      if (isRelevant && currentSection.length > 0) {
        relevantSections.push(currentSection.join('\n'))
      }
      currentSection = [line]
      isRelevant = line.toLowerCase().includes(lowerQuery)
    } else {
      currentSection.push(line)
      if (line.toLowerCase().includes(lowerQuery)) {
        isRelevant = true
      }
    }
  }
  
  if (isRelevant && currentSection.length > 0) {
    relevantSections.push(currentSection.join('\n'))
  }
  
  return relevantSections.length > 0 
    ? relevantSections.join('\n\n---\n\n')
    : null
}

/**
 * Obtiene información de una categoría específica
 */
export async function getCategoryInfo(category) {
  const validCategories = ['marca', 'ecommerce', 'servicios_ia', 'equipos', 'membresias', 'marketplace', 'faqs']
  
  if (!validCategories.includes(category)) {
    throw new Error(`Categoría inválida: ${category}`)
  }
  
  return await readCategoryDocs(category)
}
