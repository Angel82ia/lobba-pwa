import { getMembershipDashboard, useEmergencyArticle } from '../services/membershipDashboardService.js'

export const getDashboard = async (req, res) => {
  try {
    const dashboard = await getMembershipDashboard(req.user.userId)
    return res.status(200).json(dashboard)
  } catch (error) {
    console.error('Error getting membership dashboard:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const useEmergency = async (req, res) => {
  try {
    const { articleType } = req.body
    if (!articleType) {
      return res.status(400).json({ error: 'Article type is required' })
    }

    const result = await useEmergencyArticle(req.user.userId, articleType)
    return res.status(200).json(result)
  } catch (error) {
    console.error('Error using emergency:', error)
    return res.status(400).json({ error: error.message })
  }
}
