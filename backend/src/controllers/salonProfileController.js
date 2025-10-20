import { validationResult } from 'express-validator'
import * as SalonProfile from '../models/SalonProfile.js'
import * as SalonService from '../models/SalonService.js'
import * as SalonCategory from '../models/SalonCategory.js'
import * as SalonGallery from '../models/SalonGallery.js'
import logger from '../utils/logger.js'

export const getSalonProfile = async (req, res) => {
  try {
    const { id } = req.params
    const profile = await SalonProfile.findSalonProfileById(id)

    if (!profile) {
      return res.status(404).json({ error: 'Salon profile not found' })
    }

    // Obtener galería de imágenes
    const galleryImages = await SalonGallery.findGalleryImagesBySalonId(id)

    res.json({
      id: profile.id,
      userId: profile.user_id,
      businessName: profile.business_name,
      description: profile.description,
      address: profile.address,
      city: profile.city,
      postalCode: profile.postal_code,
      country: profile.country,
      phone: profile.phone,
      website: profile.website,
      location:
        profile.latitude && profile.longitude
          ? { latitude: profile.latitude, longitude: profile.longitude }
          : null,
      businessHours: profile.business_hours,
      isClickCollect: profile.is_click_collect,
      acceptsReservations: profile.accepts_reservations,
      rating: profile.rating,
      totalReviews: profile.total_reviews,
      isActive: profile.is_active,
      verified: profile.verified,
      // Google Calendar integration
      google_calendar_enabled: profile.google_calendar_enabled || false,
      google_calendar_id: profile.google_calendar_id || null,
      google_sync_enabled: profile.google_sync_enabled || false,
      last_google_sync: profile.last_google_sync || null,
      gallery: galleryImages.map(img => ({
        id: img.id,
        cloudinaryUrl: img.cloudinary_url,
        thumbnailUrl: img.thumbnail_url,
        title: img.title,
        description: img.description,
        isCover: img.is_cover_photo,
      })),
    })
  } catch (error) {
    logger.error('Get salon profile error:', error)
    res.status(500).json({ error: 'Failed to fetch salon profile' })
  }
}

export const createSalonProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const existingProfile = await SalonProfile.findSalonProfileByUserId(req.user.id)
    if (existingProfile) {
      return res.status(409).json({ error: 'Salon profile already exists' })
    }

    const {
      businessName,
      description,
      address,
      city,
      postalCode,
      phone,
      website,
      location,
      businessHours,
      isClickCollect,
      acceptsReservations,
    } = req.body

    const profile = await SalonProfile.createSalonProfile({
      userId: req.user.id,
      businessName,
      description,
      address,
      city,
      postalCode,
      phone,
      website,
      location,
      businessHours,
      isClickCollect,
      acceptsReservations,
    })

    res.status(201).json({
      id: profile.id,
      userId: profile.user_id,
      businessName: profile.business_name,
      description: profile.description,
      address: profile.address,
      city: profile.city,
      postalCode: profile.postal_code,
      phone: profile.phone,
      website: profile.website,
      createdAt: profile.created_at,
    })
  } catch (error) {
    logger.error('Create salon profile error:', error)
    res.status(500).json({ error: 'Failed to create salon profile' })
  }
}

export const updateSalonProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const profile = await SalonProfile.findSalonProfileById(id)

    if (!profile) {
      return res.status(404).json({ error: 'Salon profile not found' })
    }

    if (profile.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const {
      businessName,
      description,
      address,
      city,
      postalCode,
      phone,
      website,
      location,
      businessHours,
      isClickCollect,
      acceptsReservations,
    } = req.body

    const updates = {}
    if (businessName !== undefined) updates.businessName = businessName
    if (description !== undefined) updates.description = description
    if (address !== undefined) updates.address = address
    if (city !== undefined) updates.city = city
    if (postalCode !== undefined) updates.postalCode = postalCode
    if (phone !== undefined) updates.phone = phone
    if (website !== undefined) updates.website = website
    if (location !== undefined) updates.location = location
    if (businessHours !== undefined) updates.businessHours = businessHours
    if (isClickCollect !== undefined) updates.isClickCollect = isClickCollect
    if (acceptsReservations !== undefined) updates.acceptsReservations = acceptsReservations

    const updatedProfile = await SalonProfile.updateSalonProfile(id, updates)

    res.json({
      id: updatedProfile.id,
      userId: updatedProfile.user_id,
      businessName: updatedProfile.business_name,
      description: updatedProfile.description,
      address: updatedProfile.address,
      city: updatedProfile.city,
    })
  } catch (error) {
    logger.error('Update salon profile error:', error)
    res.status(500).json({ error: 'Failed to update salon profile' })
  }
}

export const deleteSalonProfile = async (req, res) => {
  try {
    const { id } = req.params
    const profile = await SalonProfile.findSalonProfileById(id)

    if (!profile) {
      return res.status(404).json({ error: 'Salon profile not found' })
    }

    if (profile.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await SalonProfile.updateSalonProfile(id, { isActive: false })

    res.json({ message: 'Salon profile deleted successfully' })
  } catch (error) {
    logger.error('Delete salon profile error:', error)
    res.status(500).json({ error: 'Failed to delete salon profile' })
  }
}

export const getSalonServices = async (req, res) => {
  try {
    const { id } = req.params
    const services = await SalonService.findServicesBySalonId(id)

    const formattedServices = services.map(service => ({
      id: service.id,
      salonProfileId: service.salon_profile_id,
      name: service.name,
      description: service.description,
      price: service.price,
      durationMinutes: service.duration_minutes,
      discountPercentage: service.discount_percentage,
      isActive: service.is_active,
    }))

    res.json(formattedServices)
  } catch (error) {
    logger.error('Get salon services error:', error)
    res.status(500).json({ error: 'Failed to fetch salon services' })
  }
}

export const createSalonService = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const profile = await SalonProfile.findSalonProfileById(id)

    if (!profile) {
      return res.status(404).json({ error: 'Salon profile not found' })
    }

    if (profile.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { name, description, price, durationMinutes, discountPercentage } = req.body

    const service = await SalonService.createSalonService({
      salonProfileId: id,
      name,
      description,
      price,
      durationMinutes,
      discountPercentage,
    })

    res.status(201).json({
      id: service.id,
      salonProfileId: service.salon_profile_id,
      name: service.name,
      description: service.description,
      price: service.price,
      durationMinutes: service.duration_minutes,
      discountPercentage: service.discount_percentage,
    })
  } catch (error) {
    logger.error('Create salon service error:', error)
    res.status(500).json({ error: 'Failed to create salon service' })
  }
}

export const getAllCategories = async (req, res) => {
  try {
    const categories = await SalonCategory.findAllCategories()

    const formattedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      parentCategoryId: cat.parent_category_id,
      isActive: cat.is_active,
      sortOrder: cat.sort_order,
    }))

    res.json(formattedCategories)
  } catch (error) {
    logger.error('Get categories error:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
}

export const assignCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { categoryId } = req.body

    const profile = await SalonProfile.findSalonProfileById(id)

    if (!profile) {
      return res.status(404).json({ error: 'Salon profile not found' })
    }

    if (profile.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await SalonCategory.assignCategoryToSalon(id, categoryId)

    res.status(201).json({ message: 'Category assigned successfully' })
  } catch (error) {
    logger.error('Assign category error:', error)
    res.status(500).json({ error: 'Failed to assign category' })
  }
}

export const getAllSalons = async (req, res) => {
  try {
    const { city, category, page, limit, sortBy } = req.query

    const salons = await SalonProfile.findAllSalons({
      city,
      category,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sortBy,
    })

    const formattedSalons = salons.map(salon => ({
      id: salon.id,
      userId: salon.user_id,
      businessName: salon.business_name,
      description: salon.description,
      address: salon.address,
      city: salon.city,
      postalCode: salon.postal_code,
      country: salon.country,
      phone: salon.phone,
      website: salon.website,
      location:
        salon.latitude && salon.longitude
          ? { latitude: salon.latitude, longitude: salon.longitude }
          : null,
      businessHours: salon.business_hours,
      isClickCollect: salon.is_click_collect,
      acceptsReservations: salon.accepts_reservations,
      rating: salon.rating,
      totalReviews: salon.total_reviews,
      isActive: salon.is_active,
      verified: salon.verified,
    }))

    res.json(formattedSalons)
  } catch (error) {
    logger.error('Get all salons error:', error)
    res.status(500).json({ error: 'Failed to fetch salons' })
  }
}

export const getSalonsNearby = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { latitude, longitude, radius } = req.query

    const centerLocation = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    }

    const radiusKm = radius ? parseFloat(radius) : 5

    const salons = await SalonProfile.findSalonsInRadius(centerLocation, radiusKm)

    const formattedSalons = salons.map(salon => ({
      id: salon.id,
      userId: salon.user_id,
      businessName: salon.business_name,
      description: salon.description,
      address: salon.address,
      city: salon.city,
      postalCode: salon.postal_code,
      country: salon.country,
      phone: salon.phone,
      website: salon.website,
      location:
        salon.latitude && salon.longitude
          ? { latitude: salon.latitude, longitude: salon.longitude }
          : null,
      distance: salon.distance_km ? parseFloat(salon.distance_km).toFixed(2) : null,
      businessHours: salon.business_hours,
      isClickCollect: salon.is_click_collect,
      acceptsReservations: salon.accepts_reservations,
      rating: salon.rating,
      totalReviews: salon.total_reviews,
      isActive: salon.is_active,
      verified: salon.verified,
    }))

    res.json({
      center: centerLocation,
      radius: radiusKm,
      count: formattedSalons.length,
      salons: formattedSalons,
    })
  } catch (error) {
    logger.error('Get salons nearby error:', error)
    res.status(500).json({ error: 'Failed to fetch nearby salons' })
  }
}
