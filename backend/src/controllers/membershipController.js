import { validationResult } from 'express-validator'
import * as SharedMembership from '../models/SharedMembership.js'
import * as Membership from '../models/Membership.js'
import pool from '../config/database.js'

export const createSharedMembership = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { membershipId, sharedWithName, sharedWithBirthdate, relation } = req.body
    const userId = req.user.id

    const membership = await Membership.findMembershipById(membershipId)
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' })
    }

    if (membership.user_id !== userId) {
      return res.status(403).json({ error: 'You can only share your own membership' })
    }

    if (membership.status !== 'active') {
      return res.status(400).json({ error: 'Only active memberships can be shared' })
    }

    if (membership.plan_type !== 'spirit') {
      return res.status(400).json({ error: 'Only Spirit memberships can be shared' })
    }

    const duplicate = await SharedMembership.checkDuplicateActive(membershipId, sharedWithName)
    if (duplicate) {
      return res.status(409).json({ error: 'This membership is already shared with this person' })
    }

    const birthdate = new Date(sharedWithBirthdate)
    const age = Math.floor((new Date() - birthdate) / (365.25 * 24 * 60 * 60 * 1000))
    const isMinor = age < 18

    const sharedMembership = await SharedMembership.createSharedMembership({
      membershipId,
      sharedWithName,
      sharedWithBirthdate,
      relation,
      createdBy: userId
    })

    await pool.query(
      `INSERT INTO membership_audit (user_id, action, resource_type, resource_id, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        'create_shared_membership',
        'shared_membership',
        sharedMembership.id,
        JSON.stringify({ sharedWithName, relation, isMinor })
      ]
    )

    res.status(201).json({
      id: sharedMembership.id,
      membershipId: sharedMembership.membership_id,
      status: sharedMembership.status,
      isMinor,
      createdAt: sharedMembership.created_at
    })
  } catch (error) {
    console.error('Error creating shared membership:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getSharedMembershipByMembershipId = async (req, res) => {
  try {
    const { membershipId } = req.params
    const userId = req.user.id

    const membership = await Membership.findMembershipById(membershipId)
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' })
    }

    if (membership.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const sharedMembership = await SharedMembership.findSharedMembershipByMembershipId(membershipId)
    
    if (!sharedMembership) {
      return res.status(404).json({ error: 'No shared membership found' })
    }

    res.json(sharedMembership)
  } catch (error) {
    console.error('Error getting shared membership:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateSharedMembership = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const { sharedWithName, sharedWithBirthdate, relation } = req.body
    const userId = req.user.id

    const sharedMembership = await SharedMembership.findSharedMembershipById(id)
    if (!sharedMembership) {
      return res.status(404).json({ error: 'Shared membership not found' })
    }

    if (sharedMembership.created_by !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own shared memberships' })
    }

    if (sharedMembership.status !== 'active') {
      return res.status(400).json({ error: 'Cannot edit revoked shared membership' })
    }

    const updates = {}
    if (sharedWithName) updates.shared_with_name = sharedWithName
    if (sharedWithBirthdate) updates.shared_with_birthdate = sharedWithBirthdate
    if (relation) updates.relation = relation

    const updated = await SharedMembership.updateSharedMembership(id, updates)

    await pool.query(
      `INSERT INTO membership_audit (user_id, action, resource_type, resource_id, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        'update_shared_membership',
        'shared_membership',
        id,
        JSON.stringify(updates)
      ]
    )

    res.json(updated)
  } catch (error) {
    console.error('Error updating shared membership:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const revokeSharedMembership = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const sharedMembership = await SharedMembership.findSharedMembershipById(id)
    if (!sharedMembership) {
      return res.status(404).json({ error: 'Shared membership not found' })
    }

    if (sharedMembership.created_by !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only revoke your own shared memberships' })
    }

    if (sharedMembership.status === 'revoked') {
      return res.status(400).json({ error: 'Shared membership is already revoked' })
    }

    const revoked = await SharedMembership.revokeSharedMembership(id)

    await pool.query(
      `INSERT INTO membership_audit (user_id, action, resource_type, resource_id, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        'revoke_shared_membership',
        'shared_membership',
        id,
        JSON.stringify({ previousStatus: sharedMembership.status })
      ]
    )

    res.json(revoked)
  } catch (error) {
    console.error('Error revoking shared membership:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getMySharedMemberships = async (req, res) => {
  try {
    const userId = req.user.id
    const sharedMemberships = await SharedMembership.findSharedMembershipsByCreatedBy(userId)
    res.json(sharedMemberships)
  } catch (error) {
    console.error('Error getting shared memberships:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
