-- Script para ejecutar migraciones faltantes en producción
-- Ejecutar en orden

-- 1. Crear tabla availability_blocks
CREATE TABLE IF NOT EXISTS availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_profile_id UUID NOT NULL REFERENCES salon_profiles(id) ON DELETE CASCADE,
  
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  block_type VARCHAR(50) DEFAULT 'manual' CHECK (
    block_type IN ('manual', 'vacation', 'event', 'maintenance', 'google_calendar')
  ),
  
  title VARCHAR(255),
  description TEXT,
  
  google_calendar_event_id VARCHAR(255),
  
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule JSONB,
  
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_blocks_salon 
  ON availability_blocks(salon_profile_id);

CREATE INDEX IF NOT EXISTS idx_availability_blocks_time_range 
  ON availability_blocks(start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_availability_blocks_active 
  ON availability_blocks(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_availability_blocks_google_event 
  ON availability_blocks(google_calendar_event_id) 
  WHERE google_calendar_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_availability_blocks_salon_time_active 
  ON availability_blocks(salon_profile_id, start_time, end_time) 
  WHERE is_active = true;

CREATE OR REPLACE FUNCTION update_availability_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER availability_blocks_updated_at
  BEFORE UPDATE ON availability_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_availability_blocks_updated_at();

-- 2. Agregar columnas de Google Calendar a salon_profiles
ALTER TABLE salon_profiles 
  ADD COLUMN IF NOT EXISTS google_calendar_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS google_calendar_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_access_token TEXT,
  ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMP,
  ADD COLUMN IF NOT EXISTS google_sync_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_webhook_channel_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS google_webhook_resource_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS google_webhook_expiration TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_google_sync TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_salon_google_calendar 
  ON salon_profiles(google_calendar_id) 
  WHERE google_calendar_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_salon_google_sync_enabled 
  ON salon_profiles(google_sync_enabled) 
  WHERE google_sync_enabled = true;

CREATE INDEX IF NOT EXISTS idx_salon_google_webhook 
  ON salon_profiles(google_webhook_channel_id) 
  WHERE google_webhook_channel_id IS NOT NULL;

-- 3. Fix timestamps to use TIMESTAMPTZ (si aún no se aplicó)
ALTER TABLE reservations
  ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'UTC',
  ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time AT TIME ZONE 'UTC';

-- Verificar que todo se creó correctamente
SELECT 
  'availability_blocks' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'availability_blocks'
UNION ALL
SELECT 
  'salon_profiles (google columns)',
  COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'salon_profiles' 
  AND column_name LIKE 'google%';

