import { findUserById, updateUser } from '../models/User.js'
import { validationResult } from 'express-validator'

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id
    
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const user = await findUserById(userId)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      membershipActive: user.membership_active,
      membershipStatus: user.membership_status,
      createdAt: user.created_at,
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { firstName, lastName, avatar, bio } = req.body
    
    const user = await updateUser(req.user.id, {
      first_name: firstName,
      last_name: lastName,
      avatar,
      bio,
    })

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatar: user.avatar,
      bio: user.bio,
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

export const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.id
    
    await updateUser(userId, {
      email: `anonymized-${userId}@deleted.local`,
      first_name: 'Deleted',
      last_name: 'User',
      avatar: null,
      bio: null,
      is_active: false,
    })

    res.json({ message: 'Profile deleted successfully' })
  } catch (error) {
    console.error('Delete profile error:', error)
    res.status(500).json({ error: 'Failed to delete profile' })
  }
}
