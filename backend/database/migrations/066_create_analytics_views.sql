
CREATE OR REPLACE VIEW v_reservations_by_status AS
SELECT 
  salon_profile_id,
  status,
  COUNT(*) as count,
  SUM(total_price) as total_revenue,
  AVG(total_price) as avg_price
FROM reservations
GROUP BY salon_profile_id, status;

CREATE OR REPLACE VIEW v_reservations_by_day AS
SELECT 
  salon_profile_id,
  DATE(start_time) as date,
  COUNT(*) as count,
  SUM(total_price) as daily_revenue
FROM reservations
WHERE status NOT IN ('cancelled', 'no_show')
GROUP BY salon_profile_id, DATE(start_time);

CREATE OR REPLACE VIEW v_popular_services AS
SELECT 
  ss.salon_profile_id,
  ss.id as service_id,
  ss.name as service_name,
  COUNT(r.id) as bookings_count,
  SUM(r.total_price) as total_revenue
FROM salon_services ss
LEFT JOIN reservations r ON r.service_id = ss.id
  AND r.status NOT IN ('cancelled', 'no_show')
GROUP BY ss.salon_profile_id, ss.id, ss.name;

CREATE OR REPLACE VIEW v_cancellation_rate AS
SELECT 
  salon_profile_id,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
  COUNT(*) FILTER (WHERE status NOT IN ('cancelled')) as completed,
  COUNT(*) as total,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'cancelled')::numeric / 
     NULLIF(COUNT(*)::numeric, 0) * 100), 
    2
  ) as cancellation_rate_percent
FROM reservations
GROUP BY salon_profile_id;

CREATE OR REPLACE VIEW v_recurring_clients AS
SELECT 
  salon_profile_id,
  user_id,
  COUNT(*) as visits_count,
  SUM(total_price) as total_spent,
  MIN(start_time) as first_visit,
  MAX(start_time) as last_visit
FROM reservations
WHERE status IN ('confirmed', 'completed')
GROUP BY salon_profile_id, user_id
HAVING COUNT(*) > 1;

CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT 
  salon_profile_id,
  DATE_TRUNC('month', start_time) as month,
  COUNT(*) as reservations_count,
  SUM(total_price) as total_revenue,
  SUM(commission_amount) as total_commission,
  SUM(amount_to_commerce) as net_revenue
FROM reservations
WHERE status IN ('confirmed', 'completed')
  AND payment_status = 'paid'
GROUP BY salon_profile_id, DATE_TRUNC('month', start_time);

CREATE OR REPLACE VIEW v_busy_hours AS
SELECT 
  salon_profile_id,
  EXTRACT(HOUR FROM start_time) as hour_of_day,
  COUNT(*) as bookings_count
FROM reservations
WHERE status NOT IN ('cancelled', 'no_show')
GROUP BY salon_profile_id, EXTRACT(HOUR FROM start_time);

CREATE OR REPLACE VIEW v_busy_weekdays AS
SELECT 
  salon_profile_id,
  EXTRACT(DOW FROM start_time) as day_of_week,
  CASE EXTRACT(DOW FROM start_time)
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    WHEN 6 THEN 'Sábado'
  END as day_name,
  COUNT(*) as bookings_count,
  SUM(total_price) as daily_revenue
FROM reservations
WHERE status NOT IN ('cancelled', 'no_show')
GROUP BY salon_profile_id, EXTRACT(DOW FROM start_time);

CREATE OR REPLACE VIEW v_auto_confirmation_stats AS
SELECT 
  salon_profile_id,
  COUNT(*) FILTER (WHERE auto_confirmed = true) as auto_confirmed,
  COUNT(*) FILTER (WHERE auto_confirmed = false OR auto_confirmed IS NULL) as manual_confirmed,
  COUNT(*) as total,
  ROUND(
    (COUNT(*) FILTER (WHERE auto_confirmed = true)::numeric / 
     NULLIF(COUNT(*)::numeric, 0) * 100), 
    2
  ) as auto_confirm_rate_percent
FROM reservations
WHERE status NOT IN ('cancelled', 'pending')
GROUP BY salon_profile_id;

CREATE OR REPLACE VIEW v_notification_stats AS
SELECT 
  r.salon_profile_id,
  COUNT(*) FILTER (WHERE sn.status = 'sent') as sent,
  COUNT(*) FILTER (WHERE sn.status = 'pending') as pending,
  COUNT(*) FILTER (WHERE sn.status = 'failed') as failed,
  COUNT(*) FILTER (WHERE sn.status = 'cancelled') as cancelled,
  COUNT(*) as total,
  ROUND(
    (COUNT(*) FILTER (WHERE sn.status = 'sent')::numeric / 
     NULLIF(COUNT(*)::numeric, 0) * 100), 
    2
  ) as success_rate_percent
FROM scheduled_notifications sn
JOIN reservations r ON sn.reservation_id = r.id
GROUP BY r.salon_profile_id;

COMMENT ON VIEW v_reservations_by_status IS 'Reservas agrupadas por estado y salón';
COMMENT ON VIEW v_reservations_by_day IS 'Reservas e ingresos diarios por salón';
COMMENT ON VIEW v_popular_services IS 'Servicios más reservados por salón';
COMMENT ON VIEW v_cancellation_rate IS 'Tasa de cancelación por salón';
COMMENT ON VIEW v_recurring_clients IS 'Clientes que han visitado más de una vez';
COMMENT ON VIEW v_monthly_revenue IS 'Ingresos mensuales por salón';
COMMENT ON VIEW v_busy_hours IS 'Horas del día más ocupadas';
COMMENT ON VIEW v_busy_weekdays IS 'Días de la semana más ocupados';
COMMENT ON VIEW v_auto_confirmation_stats IS 'Estadísticas de auto-confirmación';
COMMENT ON VIEW v_notification_stats IS 'Estadísticas de notificaciones enviadas';
