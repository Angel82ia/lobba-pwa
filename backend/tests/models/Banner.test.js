import { describe, it, expect, beforeEach } from 'vitest'
import * as Banner from '../../src/models/Banner.js'
import pool from '../../src/config/database.js'

describe('Banner Model', () => {
  let testUserId

  beforeEach(async () => {
    await pool.query('DELETE FROM banners')
    await pool.query("DELETE FROM users WHERE email IN ('banner-test@example.com')")

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ('banner-test@example.com', 'hash', 'Banner', 'Test', 'admin')
       RETURNING id`
    )
    testUserId = userResult.rows[0].id
  })

  describe('createBanner', () => {
    it('should create banner with required fields', async () => {
      const banner = await Banner.createBanner({
        title: 'Test Banner',
        content: 'Test content',
        type: 'announcement',
        imageUrl: null,
        priority: 0,
        startDate: null,
        endDate: null,
        createdBy: testUserId,
      })

      expect(banner).toBeTruthy()
      expect(banner.title).toBe('Test Banner')
      expect(banner.content).toBe('Test content')
      expect(banner.type).toBe('announcement')
      expect(banner.is_active).toBe(true)
    })

    it('should create banner with all fields', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')

      const banner = await Banner.createBanner({
        title: 'Full Banner',
        content: 'Complete banner',
        type: 'promotion',
        imageUrl: 'https://example.com/image.jpg',
        priority: 5,
        startDate,
        endDate,
        createdBy: testUserId,
      })

      expect(banner.title).toBe('Full Banner')
      expect(banner.type).toBe('promotion')
      expect(banner.image_url).toBe('https://example.com/image.jpg')
      expect(banner.priority).toBe(5)
    })
  })

  describe('findBannerById', () => {
    it('should find banner by id', async () => {
      const created = await Banner.createBanner({
        title: 'Find Test',
        content: 'Find content',
        type: 'news',
        imageUrl: null,
        priority: 0,
        startDate: null,
        endDate: null,
        createdBy: testUserId,
      })

      const found = await Banner.findBannerById(created.id)

      expect(found.id).toBe(created.id)
      expect(found.title).toBe('Find Test')
    })

    it('should return undefined for non-existent id', async () => {
      const found = await Banner.findBannerById('00000000-0000-0000-0000-000000000000')
      expect(found).toBeUndefined()
    })
  })

  describe('findActiveBanners', () => {
    beforeEach(async () => {
      await Banner.createBanner({
        title: 'Active Banner',
        content: 'Active content',
        type: 'announcement',
        imageUrl: null,
        priority: 5,
        startDate: null,
        endDate: null,
        createdBy: testUserId,
      })

      await Banner.createBanner({
        title: 'Inactive Banner',
        content: 'Inactive content',
        type: 'news',
        imageUrl: null,
        priority: 1,
        startDate: null,
        endDate: null,
        createdBy: testUserId,
      })

      const inactive = await Banner.createBanner({
        title: 'Disabled Banner',
        content: 'Disabled content',
        type: 'promotion',
        imageUrl: null,
        priority: 3,
        startDate: null,
        endDate: null,
        createdBy: testUserId,
      })

      await Banner.updateBanner(inactive.id, { isActive: false })
    })

    it('should return only active banners ordered by priority', async () => {
      const banners = await Banner.findActiveBanners()

      expect(banners).toHaveLength(2)
      expect(banners[0].title).toBe('Active Banner')
      expect(banners[0].priority).toBe(5)
      expect(banners[1].priority).toBe(1)
    })
  })

  describe('updateBanner', () => {
    it('should update banner fields', async () => {
      const banner = await Banner.createBanner({
        title: 'Original Title',
        content: 'Original content',
        type: 'announcement',
        imageUrl: null,
        priority: 0,
        startDate: null,
        endDate: null,
        createdBy: testUserId,
      })

      const updated = await Banner.updateBanner(banner.id, {
        title: 'Updated Title',
        priority: 10,
      })

      expect(updated.title).toBe('Updated Title')
      expect(updated.priority).toBe(10)
      expect(updated.content).toBe('Original content')
    })
  })

  describe('deleteBanner', () => {
    it('should delete banner', async () => {
      const banner = await Banner.createBanner({
        title: 'To Delete',
        content: 'Delete content',
        type: 'announcement',
        imageUrl: null,
        priority: 0,
        startDate: null,
        endDate: null,
        createdBy: testUserId,
      })

      const deleted = await Banner.deleteBanner(banner.id)
      const found = await Banner.findBannerById(banner.id)

      expect(deleted.id).toBe(banner.id)
      expect(found).toBeUndefined()
    })
  })

  describe('toggleBannerActive', () => {
    it('should toggle banner active status', async () => {
      const banner = await Banner.createBanner({
        title: 'Toggle Test',
        content: 'Toggle content',
        type: 'announcement',
        imageUrl: null,
        priority: 0,
        startDate: null,
        endDate: null,
        createdBy: testUserId,
      })

      expect(banner.is_active).toBe(true)

      const toggled = await Banner.toggleBannerActive(banner.id)
      expect(toggled.is_active).toBe(false)

      const toggledAgain = await Banner.toggleBannerActive(banner.id)
      expect(toggledAgain.is_active).toBe(true)
    })
  })
})
