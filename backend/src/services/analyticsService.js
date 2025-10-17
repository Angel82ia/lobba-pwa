import pool from '../config/database.js'

/**
 * Dashboard general del salón
 */
export const getSalonDashboard = async (salonId, startDate, endDate) => {
  try {
    const overview = await pool.query(
      `SELECT 
         COUNT(*) as total_reservations,
         COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
         COUNT(*) FILTER (WHERE status = 'no_show') as no_show,
         SUM(total_price) FILTER (WHERE status IN ('confirmed', 'completed')) as total_revenue,
         AVG(total_price) FILTER (WHERE status IN ('confirmed', 'completed')) as avg_booking_value,
         COUNT(DISTINCT user_id) as unique_clients
       FROM reservations
       WHERE salon_profile_id = $1
         AND start_time BETWEEN $2 AND $3`,
      [salonId, startDate, endDate]
    )

    const popularServices = await pool.query(
      `SELECT * FROM v_popular_services
       WHERE salon_profile_id = $1
       ORDER BY bookings_count DESC
       LIMIT 5`,
      [salonId]
    )

    const cancellationRate = await pool.query(
      `SELECT * FROM v_cancellation_rate
       WHERE salon_profile_id = $1`,
      [salonId]
    )

    const autoConfirmStats = await pool.query(
      `SELECT * FROM v_auto_confirmation_stats
       WHERE salon_profile_id = $1`,
      [salonId]
    )

    const notificationStats = await pool.query(
      `SELECT * FROM v_notification_stats
       WHERE salon_profile_id = $1`,
      [salonId]
    )

    return {
      overview: overview.rows[0],
      popularServices: popularServices.rows,
      cancellationRate: cancellationRate.rows[0],
      autoConfirmStats: autoConfirmStats.rows[0],
      notificationStats: notificationStats.rows[0]
    }

  } catch (error) {
    console.error('Error getting salon dashboard:', error)
    throw error
  }
}

/**
 * Gráfico de ingresos diarios
 */
export const getDailyRevenue = async (salonId, startDate, endDate) => {
  const result = await pool.query(
    `SELECT * FROM v_reservations_by_day
     WHERE salon_profile_id = $1
       AND date BETWEEN $2 AND $3
     ORDER BY date`,
    [salonId, startDate, endDate]
  )

  return result.rows
}

/**
 * Gráfico de ingresos mensuales
 */
export const getMonthlyRevenue = async (salonId, startDate, endDate) => {
  const result = await pool.query(
    `SELECT * FROM v_monthly_revenue
     WHERE salon_profile_id = $1
       AND month BETWEEN DATE_TRUNC('month', $2::date) 
                      AND DATE_TRUNC('month', $3::date)
     ORDER BY month`,
    [salonId, startDate, endDate]
  )

  return result.rows
}

/**
 * Clientes recurrentes
 */
export const getRecurringClients = async (salonId) => {
  const result = await pool.query(
    `SELECT 
       vc.*,
       u.name as client_name,
       u.email as client_email
     FROM v_recurring_clients vc
     JOIN users u ON vc.user_id = u.id
     WHERE vc.salon_profile_id = $1
     ORDER BY vc.visits_count DESC, vc.total_spent DESC
     LIMIT 20`,
    [salonId]
  )

  return result.rows
}

/**
 * Horarios más ocupados
 */
export const getBusyHours = async (salonId) => {
  const result = await pool.query(
    `SELECT * FROM v_busy_hours
     WHERE salon_profile_id = $1
     ORDER BY hour_of_day`,
    [salonId]
  )

  return result.rows
}

/**
 * Días de la semana más ocupados
 */
export const getBusyWeekdays = async (salonId) => {
  const result = await pool.query(
    `SELECT * FROM v_busy_weekdays
     WHERE salon_profile_id = $1
     ORDER BY day_of_week`,
    [salonId]
  )

  return result.rows
}

/**
 * Comparación de períodos
 */
export const comparePeriods = async (salonId, period1Start, period1End, period2Start, period2End) => {
  const period1 = await pool.query(
    `SELECT 
       COUNT(*) as reservations,
       SUM(total_price) FILTER (WHERE status IN ('confirmed', 'completed')) as revenue,
       COUNT(DISTINCT user_id) as unique_clients,
       AVG(total_price) as avg_booking
     FROM reservations
     WHERE salon_profile_id = $1
       AND start_time BETWEEN $2 AND $3`,
    [salonId, period1Start, period1End]
  )

  const period2 = await pool.query(
    `SELECT 
       COUNT(*) as reservations,
       SUM(total_price) FILTER (WHERE status IN ('confirmed', 'completed')) as revenue,
       COUNT(DISTINCT user_id) as unique_clients,
       AVG(total_price) as avg_booking
     FROM reservations
     WHERE salon_profile_id = $1
       AND start_time BETWEEN $2 AND $3`,
    [salonId, period2Start, period2End]
  )

  const p1 = period1.rows[0]
  const p2 = period2.rows[0]

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return null
    return ((current - previous) / previous * 100).toFixed(2)
  }

  return {
    period1: {
      start: period1Start,
      end: period1End,
      metrics: p1
    },
    period2: {
      start: period2Start,
      end: period2End,
      metrics: p2
    },
    comparison: {
      reservations_change: calculateChange(p1.reservations, p2.reservations),
      revenue_change: calculateChange(p1.revenue, p2.revenue),
      clients_change: calculateChange(p1.unique_clients, p2.unique_clients),
      avg_booking_change: calculateChange(p1.avg_booking, p2.avg_booking)
    }
  }
}

/**
 * Métricas de retención de clientes
 */
export const getClientRetention = async (salonId) => {
  const result = await pool.query(
    `WITH client_visits AS (
       SELECT 
         user_id,
         COUNT(*) as total_visits,
         MIN(start_time) as first_visit,
         MAX(start_time) as last_visit,
         EXTRACT(DAYS FROM (MAX(start_time) - MIN(start_time))) as days_between
       FROM reservations
       WHERE salon_profile_id = $1
         AND status IN ('confirmed', 'completed')
       GROUP BY user_id
     )
     SELECT 
       COUNT(*) FILTER (WHERE total_visits = 1) as one_time_clients,
       COUNT(*) FILTER (WHERE total_visits = 2) as two_time_clients,
       COUNT(*) FILTER (WHERE total_visits >= 3 AND total_visits < 5) as regular_clients,
       COUNT(*) FILTER (WHERE total_visits >= 5) as loyal_clients,
       COUNT(*) as total_clients,
       AVG(total_visits) as avg_visits_per_client,
       AVG(days_between) FILTER (WHERE total_visits > 1) as avg_days_between_visits
     FROM client_visits`,
    [salonId]
  )

  return result.rows[0]
}

/**
 * Performance por servicio
 */
export const getServicePerformance = async (salonId, startDate, endDate) => {
  const result = await pool.query(
    `SELECT 
       ss.id,
       ss.name,
       ss.price as base_price,
       COUNT(r.id) as bookings,
       SUM(r.total_price) as revenue,
       AVG(r.total_price) as avg_price,
       COUNT(DISTINCT r.user_id) as unique_clients,
       COUNT(*) FILTER (WHERE r.status = 'cancelled') as cancellations,
       ROUND(
         (COUNT(*) FILTER (WHERE r.status = 'cancelled')::numeric / 
          NULLIF(COUNT(*)::numeric, 0) * 100), 
         2
       ) as cancellation_rate
     FROM salon_services ss
     LEFT JOIN reservations r ON r.service_id = ss.id
       AND r.start_time BETWEEN $2 AND $3
     WHERE ss.salon_profile_id = $1
     GROUP BY ss.id, ss.name, ss.price
     ORDER BY revenue DESC NULLS LAST`,
    [salonId, startDate, endDate]
  )

  return result.rows
}

/**
 * Tasa de conversión (reservas pendientes → confirmadas)
 */
export const getConversionRate = async (salonId, startDate, endDate) => {
  const result = await pool.query(
    `SELECT 
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'pending') as pending,
       COUNT(*) FILTER (WHERE status IN ('confirmed', 'completed')) as converted,
       COUNT(*) FILTER (WHERE status = 'cancelled' AND payment_status = 'paid') as paid_cancelled,
       ROUND(
         (COUNT(*) FILTER (WHERE status IN ('confirmed', 'completed'))::numeric / 
          NULLIF(COUNT(*)::numeric, 0) * 100), 
         2
       ) as conversion_rate
     FROM reservations
     WHERE salon_profile_id = $1
       AND created_at BETWEEN $2 AND $3`,
    [salonId, startDate, endDate]
  )

  return result.rows[0]
}

/**
 * Export de datos para CSV/Excel
 */
export const exportReservationData = async (salonId, startDate, endDate) => {
  const result = await pool.query(
    `SELECT 
       r.id,
       r.created_at,
       r.start_time,
       r.end_time,
       r.status,
       r.payment_status,
       r.total_price,
       r.commission_amount,
       r.amount_to_commerce,
       u.name as client_name,
       u.email as client_email,
       u.phone as client_phone,
       ss.name as service_name,
       r.auto_confirmed,
       r.cancellation_reason,
       r.cancelled_at
     FROM reservations r
     JOIN users u ON r.user_id = u.id
     JOIN salon_services ss ON r.service_id = ss.id
     WHERE r.salon_profile_id = $1
       AND r.start_time BETWEEN $2 AND $3
     ORDER BY r.start_time DESC`,
    [salonId, startDate, endDate]
  )

  return result.rows
}
