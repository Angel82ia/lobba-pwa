-- =====================================================
-- VERIFICAR MIGRACIONES EN SUPABASE
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Verificar nuevas columnas en reservations
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'reservations' 
  AND column_name IN (
    'stripe_payment_intent_id', 
    'confirmation_deadline', 
    'auto_cancelled',
    'payment_status',
    'auto_confirmed',
    'google_calendar_event_id',
    'no_show'
  )
ORDER BY column_name;

-- 2. Verificar nuevas columnas en salon_profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'salon_profiles' 
  AND column_name IN (
    'stripe_account_id',
    'whatsapp_number',
    'whatsapp_enabled',
    'google_calendar_connected',
    'google_refresh_token'
  )
ORDER BY column_name;

-- 3. Verificar nuevas tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'salon_settings',
    'availability_blocks',
    'reservation_audit_log',
    'notification_templates',
    'scheduled_notifications'
  )
ORDER BY table_name;

-- 4. Contar registros en las nuevas tablas
SELECT 
  'salon_settings' as tabla,
  COUNT(*) as registros
FROM salon_settings
UNION ALL
SELECT 
  'availability_blocks' as tabla,
  COUNT(*) as registros
FROM availability_blocks
UNION ALL
SELECT 
  'notification_templates' as tabla,
  COUNT(*) as registros
FROM notification_templates;

-- 5. Verificar que la vista de analytics existe
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name = 'reservation_analytics';

