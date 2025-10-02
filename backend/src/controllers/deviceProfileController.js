import { validationResult } from 'express-validator'
import * as DeviceProfile from '../models/DeviceProfile.js'

export const getDeviceProfile = async (req, res) => {
  try {
    const { id } = req.params
    const profile = await DeviceProfile.findDeviceProfileById(id)

    if (!profile) {
      return res.status(404).json({ error: 'Device profile not found' })
    }

    res.json({
      id: profile.id,
      userId: profile.user_id,
      deviceId: profile.device_id,
      deviceName: profile.device_name,
      deviceType: profile.device_type,
      capabilities: profile.capabilities,
      location: profile.latitude && profile.longitude
        ? { latitude: profile.latitude, longitude: profile.longitude }
        : null,
      isActive: profile.is_active,
      lastPing: profile.last_ping,
    })
  } catch (error) {
    console.error('Get device profile error:', error)
    res.status(500).json({ error: 'Failed to fetch device profile' })
  }
}

export const createDeviceProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const existingProfile = await DeviceProfile.findDeviceProfileByUserId(req.user.id)
    if (existingProfile) {
      return res.status(409).json({ error: 'Device profile already exists' })
    }

    const { deviceId, deviceName, deviceType, capabilities, location } = req.body

    const profile = await DeviceProfile.createDeviceProfile({
      userId: req.user.id,
      deviceId,
      deviceName,
      deviceType,
      capabilities,
      location,
    })

    res.status(201).json({
      id: profile.id,
      userId: profile.user_id,
      deviceId: profile.device_id,
      deviceName: profile.device_name,
      deviceType: profile.device_type,
      capabilities: profile.capabilities,
      createdAt: profile.created_at,
    })
  } catch (error) {
    console.error('Create device profile error:', error)
    res.status(500).json({ error: 'Failed to create device profile' })
  }
}

export const updateDeviceProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const profile = await DeviceProfile.findDeviceProfileById(id)

    if (!profile) {
      return res.status(404).json({ error: 'Device profile not found' })
    }

    if (profile.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { deviceName, deviceType } = req.body

    const updates = {}
    if (deviceName !== undefined) updates.deviceName = deviceName
    if (deviceType !== undefined) updates.deviceType = deviceType

    const updatedProfile = await DeviceProfile.updateDeviceProfile(id, updates)

    res.json({
      id: updatedProfile.id,
      userId: updatedProfile.user_id,
      deviceId: updatedProfile.device_id,
      deviceName: updatedProfile.device_name,
      deviceType: updatedProfile.device_type,
    })
  } catch (error) {
    console.error('Update device profile error:', error)
    res.status(500).json({ error: 'Failed to update device profile' })
  }
}

export const deleteDeviceProfile = async (req, res) => {
  try {
    const { id } = req.params
    const profile = await DeviceProfile.findDeviceProfileById(id)

    if (!profile) {
      return res.status(404).json({ error: 'Device profile not found' })
    }

    if (profile.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await DeviceProfile.deleteDeviceProfile(id)

    res.json({ message: 'Device profile deleted successfully' })
  } catch (error) {
    console.error('Delete device profile error:', error)
    res.status(500).json({ error: 'Failed to delete device profile' })
  }
}

export const updateCapabilities = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const profile = await DeviceProfile.findDeviceProfileById(id)

    if (!profile) {
      return res.status(404).json({ error: 'Device profile not found' })
    }

    if (profile.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { capabilities } = req.body

    const updatedProfile = await DeviceProfile.updateDeviceCapabilities(id, capabilities)

    res.json({
      id: updatedProfile.id,
      capabilities: updatedProfile.capabilities,
    })
  } catch (error) {
    console.error('Update capabilities error:', error)
    res.status(500).json({ error: 'Failed to update capabilities' })
  }
}

export const updateLocation = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const profile = await DeviceProfile.findDeviceProfileById(id)

    if (!profile) {
      return res.status(404).json({ error: 'Device profile not found' })
    }

    if (profile.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { latitude, longitude } = req.body

    const updatedProfile = await DeviceProfile.updateDeviceLocation(id, { latitude, longitude })

    res.json({
      id: updatedProfile.id,
      location: {
        latitude: updatedProfile.latitude,
        longitude: updatedProfile.longitude,
      },
    })
  } catch (error) {
    console.error('Update location error:', error)
    res.status(500).json({ error: 'Failed to update location' })
  }
}
