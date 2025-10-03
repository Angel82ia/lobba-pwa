import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

const runMigration = async (filename) => {
  const sql = readFileSync(join(__dirname, 'migrations', filename), 'utf-8')
  await pool.query(sql)
  console.log(`✅ Migration ${filename} completed`)
}

const main = async () => {
  try {
    console.log('🚀 Running Phase 7 database migrations...')
    
    await runMigration('026_create_community_posts_table.sql')
    await runMigration('027_create_post_comments_table.sql')
    await runMigration('028_create_post_likes_table.sql')
    await runMigration('029_create_user_follows_table.sql')
    await runMigration('030_create_design_ratings_table.sql')
    
    console.log('✅ All Phase 7 migrations completed successfully')
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    await pool.end()
    process.exit(1)
  }
}

main()
