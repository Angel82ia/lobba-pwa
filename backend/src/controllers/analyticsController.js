import * as Analytics from '../services/analyticsService.js'

/**
 * Dashboard general del salón
 */
export const getSalonDashboard = async (req, res) => {
  try {
    const { salonId } = req.params
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' })
    }

    const dashboard = await Analytics.getSalonDashboard(salonId, startDate, endDate)

    res.json(dashboard)
  } catch (error) {
    console.error('Error getting salon dashboard:', error)
    res.status(500).json({ error: 'Failed to get salon dashboard' })
  }
}

/**
 * Gráfico de ingresos diarios
 */
export const getDailyRevenue = async (req, res) => {
  try {
    const { salonId } = req.params
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' })
    }

    const data = await Analytics.getDailyRevenue(salonId, startDate, endDate)

    res.json(data)
  } catch (error) {
    console.error('Error getting daily revenue:', error)
    res.status(500).json({ error: 'Failed to get daily revenue' })
  }
}

/**
 * Gráfico de ingresos mensuales
 */
export const getMonthlyRevenue = async (req, res) => {
  try {
    const { salonId } = req.params
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' })
    }

    const data = await Analytics.getMonthlyRevenue(salonId, startDate, endDate)

    res.json(data)
  } catch (error) {
    console.error('Error getting monthly revenue:', error)
    res.status(500).json({ error: 'Failed to get monthly revenue' })
  }
}

/**
 * Clientes recurrentes
 */
export const getRecurringClients = async (req, res) => {
  try {
    const { salonId } = req.params

    const data = await Analytics.getRecurringClients(salonId)

    res.json(data)
  } catch (error) {
    console.error('Error getting recurring clients:', error)
    res.status(500).json({ error: 'Failed to get recurring clients' })
  }
}

/**
 * Horarios más ocupados
 */
export const getBusyHours = async (req, res) => {
  try {
    const { salonId } = req.params

    const data = await Analytics.getBusyHours(salonId)

    res.json(data)
  } catch (error) {
    console.error('Error getting busy hours:', error)
    res.status(500).json({ error: 'Failed to get busy hours' })
  }
}

/**
 * Días de la semana más ocupados
 */
export const getBusyWeekdays = async (req, res) => {
  try {
    const { salonId } = req.params

    const data = await Analytics.getBusyWeekdays(salonId)

    res.json(data)
  } catch (error) {
    console.error('Error getting busy weekdays:', error)
    res.status(500).json({ error: 'Failed to get busy weekdays' })
  }
}

/**
 * Comparación de períodos
 */
export const comparePeriods = async (req, res) => {
  try {
    const { salonId } = req.params
    const { period1Start, period1End, period2Start, period2End } = req.query

    if (!period1Start || !period1End || !period2Start || !period2End) {
      return res.status(400).json({ 
        error: 'period1Start, period1End, period2Start, and period2End are required' 
      })
    }

    const data = await Analytics.comparePeriods(
      salonId, 
      period1Start, 
      period1End, 
      period2Start, 
      period2End
    )

    res.json(data)
  } catch (error) {
    console.error('Error comparing periods:', error)
    res.status(500).json({ error: 'Failed to compare periods' })
  }
}

/**
 * Métricas de retención de clientes
 */
export const getClientRetention = async (req, res) => {
  try {
    const { salonId } = req.params

    const data = await Analytics.getClientRetention(salonId)

    res.json(data)
  } catch (error) {
    console.error('Error getting client retention:', error)
    res.status(500).json({ error: 'Failed to get client retention' })
  }
}

/**
 * Performance por servicio
 */
export const getServicePerformance = async (req, res) => {
  try {
    const { salonId } = req.params
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' })
    }

    const data = await Analytics.getServicePerformance(salonId, startDate, endDate)

    res.json(data)
  } catch (error) {
    console.error('Error getting service performance:', error)
    res.status(500).json({ error: 'Failed to get service performance' })
  }
}

/**
 * Tasa de conversión
 */
export const getConversionRate = async (req, res) => {
  try {
    const { salonId } = req.params
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' })
    }

    const data = await Analytics.getConversionRate(salonId, startDate, endDate)

    res.json(data)
  } catch (error) {
    console.error('Error getting conversion rate:', error)
    res.status(500).json({ error: 'Failed to get conversion rate' })
  }
}

/**
 * Exportar datos
 */
export const exportReservationData = async (req, res) => {
  try {
    const { salonId } = req.params
    const { startDate, endDate, format } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' })
    }

    const data = await Analytics.exportReservationData(salonId, startDate, endDate)

    if (format === 'csv') {
      const csv = convertToCSV(data)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=reservations-${salonId}-${Date.now()}.csv`)
      return res.send(csv)
    }

    res.json(data)
  } catch (error) {
    console.error('Error exporting reservation data:', error)
    res.status(500).json({ error: 'Failed to export reservation data' })
  }
}

/**
 * Convertir array de objetos a CSV
 */
const convertToCSV = (data) => {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => 
    Object.values(row).map(value => 
      typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value
    ).join(',')
  )

  return [headers, ...rows].join('\n')
}
