import * as NotificationPreference from '../models/NotificationPreference.js'
import * as FCMToken from '../models/FCMToken.js'
import * as Notification from '../models/Notification.js'
import * as NotificationRateLimit from '../models/NotificationRateLimit.js'
import * as SalonProfile from '../models/SalonProfile.js'
import { sendPushNotification } from '../utils/fcm.js'
import { validationResult } from 'express-validator'
import logger from '../utils/logger.js'

export const registerFCMToken = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  if (!req.body.token) {
    return res.status(400).json({ message: 'Token is required' })
  }

  try {
    const { token, deviceType } = req.body
    const userId = req.user.id

    const fcmToken = await FCMToken.registerToken({ userId, token, deviceType })
    res.json(fcmToken)
  } catch (error) {
    logger.error('Register FCM token error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id
    const preference = await NotificationPreference.getOrCreatePreference(userId)
    res.json(preference)
  } catch (error) {
    logger.error('Get preferences error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id
    const updates = req.body

    const preference = await NotificationPreference.updatePreference(userId, updates)
    res.json(preference)
  } catch (error) {
    logger.error('Update preferences error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const sendNotification = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  if (!req.body.title || !req.body.body || !req.body.type || !req.body.targetingType) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  try {
    const { title, body, type, targetingType, radiusKm } = req.body
    const userId = req.user.id

    if (!['oferta', 'evento', 'descuento', 'noticia'].includes(type)) {
      return res.status(400).json({ message: 'Invalid notification type' })
    }

    if (!['own_clients', 'geographic'].includes(targetingType)) {
      return res.status(400).json({ message: 'Invalid targeting type' })
    }

    const salonProfile = await SalonProfile.findSalonProfileByUserId(userId)
    if (!salonProfile) {
      return res.status(404).json({ message: 'Salon profile not found' })
    }

    const rateLimit = await NotificationRateLimit.checkRateLimit(salonProfile.id)
    if (!rateLimit.allowed) {
      return res.status(429).json({
        message: `Daily notification limit reached (${rateLimit.limit}/day)`,
        count: rateLimit.count,
        limit: rateLimit.limit,
      })
    }

    const centerLocation = salonProfile.latitude && salonProfile.longitude
      ? { latitude: salonProfile.latitude, longitude: salonProfile.longitude }
      : null

    const notification = await Notification.createNotification({
      salonProfileId: salonProfile.id,
      title,
      body,
      type,
      targetingType,
      radiusKm: targetingType === 'geographic' ? radiusKm : null,
      centerLocation: targetingType === 'geographic' ? centerLocation : null,
    })

    await NotificationRateLimit.incrementRateLimit(salonProfile.id)

    let targetUserIds = []
    if (targetingType === 'geographic' && centerLocation) {
      const usersInRadius = await SalonProfile.getUsersInRadius(centerLocation, radiusKm, type)
      targetUserIds = usersInRadius.map(u => u.id)
    }

    if (targetUserIds.length === 0) {
      await Notification.updateNotificationStatus(notification.id, 'sent', {
        sentCount: 0,
        successCount: 0,
        failureCount: 0,
      })
      return res.json({ 
        ...notification, 
        sentCount: 0,
        message: 'No users found in target area' 
      })
    }

    const fcmTokens = await FCMToken.findTokensByUserIds(targetUserIds)
    const tokens = fcmTokens.map(t => t.token)

    if (tokens.length === 0) {
      await Notification.updateNotificationStatus(notification.id, 'sent', {
        sentCount: 0,
        successCount: 0,
        failureCount: 0,
      })
      return res.json({ 
        ...notification, 
        sentCount: 0,
        message: 'No FCM tokens found for target users' 
      })
    }

    await Notification.updateNotificationStatus(notification.id, 'sending')

    const fcmResult = await sendPushNotification(tokens, {
      title,
      body,
      data: {
        type,
        salonId: salonProfile.id,
        notificationId: notification.id,
      },
    })

    const updatedNotification = await Notification.updateNotificationStatus(
      notification.id,
      fcmResult.success ? 'sent' : 'failed',
      {
        sentCount: tokens.length,
        successCount: fcmResult.successCount || 0,
        failureCount: fcmResult.failureCount || tokens.length,
      }
    )

    res.json(updatedNotification)
  } catch (error) {
    logger.error('Send notification error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getNotificationHistory = async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 20 } = req.query

    const salonProfile = await SalonProfile.findSalonProfileByUserId(userId)
    if (!salonProfile) {
      return res.status(404).json({ message: 'Salon profile not found' })
    }

    const notifications = await Notification.findNotificationsBySalonId(
      salonProfile.id,
      { page: parseInt(page), limit: parseInt(limit) }
    )
    res.json(notifications)
  } catch (error) {
    logger.error('Get notification history error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const notifications = await Notification.findAllNotifications({
      page: parseInt(page),
      limit: parseInt(limit),
    })
    res.json(notifications)
  } catch (error) {
    logger.error('Get all notifications error:', error)
    res.status(500).json({ message: error.message })
  }
}
