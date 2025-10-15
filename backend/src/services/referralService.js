import pool from '../config/database.js'
import logger from '../utils/logger.js'

const REFERRALS_NEEDED = 4

export const getUserReferralCode = async (userId) => {
  try {
    const result = await pool.query(
      'SELECT referral_code FROM users WHERE id = $1',
      [userId]
    )
    
    if (result.rows.length === 0) {
      throw new Error('User not found')
    }
    
    return result.rows[0].referral_code
  } catch (error) {
    logger.error('Error getting user referral code:', error)
    throw error
  }
}

export const createReferralCampaign = async (userId) => {
  try {
    const referralCode = await getUserReferralCode(userId)
    
    const existingCampaign = await pool.query(
      `SELECT id FROM referral_campaigns 
       WHERE host_user_id = $1 AND status = 'in_progress'
       LIMIT 1`,
      [userId]
    )
    
    if (existingCampaign.rows.length > 0) {
      return { campaignId: existingCampaign.rows[0].id, existing: true }
    }
    
    const currentQuarter = getCurrentQuarter()
    
    const result = await pool.query(
      `INSERT INTO referral_campaigns 
        (host_user_id, host_referral_code, raffle_quarter)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [userId, referralCode, currentQuarter]
    )
    
    return { campaignId: result.rows[0].id, existing: false }
  } catch (error) {
    logger.error('Error creating referral campaign:', error)
    throw error
  }
}

export const registerReferral = async (referredUserId, referralCode) => {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    const hostUser = await client.query(
      'SELECT id FROM users WHERE referral_code = $1',
      [referralCode]
    )
    
    if (hostUser.rows.length === 0) {
      throw new Error('Invalid referral code')
    }
    
    const hostUserId = hostUser.rows[0].id
    
    if (hostUserId === referredUserId) {
      throw new Error('Cannot refer yourself')
    }
    
    await client.query(
      'UPDATE users SET referred_by = $1 WHERE id = $2',
      [hostUserId, referredUserId]
    )
    
    let campaign = await client.query(
      `SELECT id FROM referral_campaigns
       WHERE host_user_id = $1 AND status = 'in_progress'
       LIMIT 1`,
      [hostUserId]
    )
    
    let campaignId
    
    if (campaign.rows.length === 0) {
      const currentQuarter = getCurrentQuarter()
      const newCampaign = await client.query(
        `INSERT INTO referral_campaigns
          (host_user_id, host_referral_code, raffle_quarter)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [hostUserId, referralCode, currentQuarter]
      )
      campaignId = newCampaign.rows[0].id
    } else {
      campaignId = campaign.rows[0].id
    }
    
    await client.query(
      `INSERT INTO referral_campaign_entries
        (campaign_id, referred_user_id, status)
       VALUES ($1, $2, 'pending_payment')`,
      [campaignId, referredUserId]
    )
    
    await client.query('COMMIT')
    
    logger.info(`Referral registered: ${referredUserId} referred by ${hostUserId}`)
    
    return { success: true, hostUserId, campaignId }
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Error registering referral:', error)
    throw error
  } finally {
    client.release()
  }
}

export const completeReferralEntry = async (referredUserId, membershipType) => {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    const entry = await client.query(
      `UPDATE referral_campaign_entries
       SET status = 'completed', 
           membership_chosen = $2,
           completed_at = CURRENT_TIMESTAMP
       WHERE referred_user_id = $1 AND status = 'pending_payment'
       RETURNING id, campaign_id`,
      [referredUserId, membershipType]
    )
    
    if (entry.rows.length === 0) {
      throw new Error('No pending referral entry found')
    }
    
    const { campaign_id } = entry.rows[0]
    
    const completedCount = await client.query(
      `SELECT COUNT(*) as count
       FROM referral_campaign_entries
       WHERE campaign_id = $1 AND status = 'completed'`,
      [campaign_id]
    )
    
    const count = parseInt(completedCount.rows[0].count)
    
    if (count >= REFERRALS_NEEDED) {
      await processCampaignCompletion(client, campaign_id)
    }
    
    await client.query('COMMIT')
    
    logger.info(`Referral entry completed for user ${referredUserId}`)
    
    return { success: true, completedReferrals: count, needsMore: REFERRALS_NEEDED - count }
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Error completing referral entry:', error)
    throw error
  } finally {
    client.release()
  }
}

async function processCampaignCompletion(client, campaignId) {
  const campaign = await client.query(
    `SELECT host_user_id, raffle_quarter 
     FROM referral_campaigns 
     WHERE id = $1`,
    [campaignId]
  )
  
  if (campaign.rows.length === 0) return
  
  const { host_user_id, raffle_quarter } = campaign.rows[0]
  
  await client.query(
    `UPDATE referral_campaigns
     SET free_months_granted = true, raffle_entry_granted = true
     WHERE id = $1`,
    [campaignId]
  )
  
  const existingEntry = await client.query(
    `SELECT id FROM raffle_entries
     WHERE user_id = $1 AND quarter = $2`,
    [host_user_id, raffle_quarter]
  )
  
  if (existingEntry.rows.length === 0) {
    await client.query(
      `INSERT INTO raffle_entries (user_id, campaign_id, quarter)
       VALUES ($1, $2, $3)`,
      [host_user_id, campaignId, raffle_quarter]
    )
  }
  
  logger.info(`Campaign ${campaignId} completed - rewards granted`)
}

export const getReferralStats = async (userId) => {
  try {
    const campaign = await pool.query(
      `SELECT 
        rc.id,
        rc.status,
        rc.completed_at,
        rc.free_months_granted,
        rc.raffle_entry_granted,
        rc.raffle_quarter,
        COUNT(rce.id) as total_referrals,
        COUNT(CASE WHEN rce.status = 'completed' THEN 1 END) as completed_referrals,
        COUNT(CASE WHEN rce.status = 'pending_payment' THEN 1 END) as pending_referrals
       FROM referral_campaigns rc
       LEFT JOIN referral_campaign_entries rce ON rc.id = rce.campaign_id
       WHERE rc.host_user_id = $1 AND rc.status = 'in_progress'
       GROUP BY rc.id
       LIMIT 1`,
      [userId]
    )
    
    const referralCode = await getUserReferralCode(userId)
    
    if (campaign.rows.length === 0) {
      return {
        hasActiveCampaign: false,
        referralCode,
        stats: {
          completed: 0,
          pending: 0,
          total: 0,
          needed: REFERRALS_NEEDED
        }
      }
    }
    
    const stats = campaign.rows[0]
    
    return {
      hasActiveCampaign: true,
      referralCode,
      campaignId: stats.id,
      stats: {
        completed: parseInt(stats.completed_referrals),
        pending: parseInt(stats.pending_referrals),
        total: parseInt(stats.total_referrals),
        needed: REFERRALS_NEEDED,
        remaining: Math.max(0, REFERRALS_NEEDED - parseInt(stats.completed_referrals))
      },
      rewards: {
        freeMonthsGranted: stats.free_months_granted,
        raffleEntryGranted: stats.raffle_entry_granted,
        raffleQuarter: stats.raffle_quarter
      }
    }
  } catch (error) {
    logger.error('Error getting referral stats:', error)
    throw error
  }
}

export const getReferralHistory = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.email,
        u.first_name,
        u.last_name,
        rce.registered_at,
        rce.membership_chosen,
        rce.status,
        rce.completed_at
       FROM referral_campaign_entries rce
       JOIN referral_campaigns rc ON rce.campaign_id = rc.id
       JOIN users u ON rce.referred_user_id = u.id
       WHERE rc.host_user_id = $1
       ORDER BY rce.registered_at DESC`,
      [userId]
    )
    
    return result.rows.map(row => ({
      email: row.email,
      name: `${row.first_name} ${row.last_name}`,
      registeredAt: row.registered_at,
      membershipChosen: row.membership_chosen,
      status: row.status,
      completedAt: row.completed_at
    }))
  } catch (error) {
    logger.error('Error getting referral history:', error)
    throw error
  }
}

function getCurrentQuarter() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const quarter = Math.ceil(month / 3)
  return `Q${quarter}-${year}`
}
