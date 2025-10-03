import pool from '../src/config/database.js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigrations() {
  const migrationFiles = [
    '011_create_product_categories_table.sql',
    '012_create_products_table.sql',
    '013_create_product_variants_table.sql',
    '014_create_product_images_table.sql',
    '015_create_cart_and_orders_tables.sql',
    '016_create_wishlist_table.sql',
    '017_create_shipping_methods_table.sql',
  ]

  for (const file of migrationFiles) {
    console.log(`Running migration: ${file}`)
    const sql = await fs.readFile(
      path.join(__dirname, 'migrations', file),
      'utf-8'
    )
    await pool.query(sql)
    console.log(`✓ ${file} completed`)
  }
}

runMigrations()
  .then(() => {
    console.log('All Phase 4 migrations completed successfully')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Migration error:', err)
    process.exit(1)
  })
