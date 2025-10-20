-- Script para arreglar tablas existentes que les faltan columnas
-- Este script es seguro ejecutar múltiples veces (usa IF NOT EXISTS)

-- ========================================
-- 1. ARREGLAR availability_blocks
-- ========================================

-- Agregar columnas faltantes a availability_blocks si no existen
DO $$ 
BEGIN
  -- is_active
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'availability_blocks' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE availability_blocks ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- is_recurring
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'availability_blocks' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE availability_blocks ADD COLUMN is_recurring BOOLEAN DEFAULT false;
  END IF;

  -- recurrence_rule
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'availability_blocks' AND column_name = 'recurrence_rule'
  ) THEN
    ALTER TABLE availability_blocks ADD COLUMN recurrence_rule JSONB;
  END IF;

  -- google_calendar_event_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'availability_blocks' AND column_name = 'google_calendar_event_id'
  ) THEN
    ALTER TABLE availability_blocks ADD COLUMN google_calendar_event_id VARCHAR(255);
  END IF;

  -- block_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'availability_blocks' AND column_name = 'block_type'
  ) THEN
    ALTER TABLE availability_blocks ADD COLUMN block_type VARCHAR(50) DEFAULT 'manual';
  END IF;

  -- title
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'availability_blocks' AND column_name = 'title'
  ) THEN
    ALTER TABLE availability_blocks ADD COLUMN title VARCHAR(255);
  END IF;

  -- description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'availability_blocks' AND column_name = 'description'
  ) THEN
    ALTER TABLE availability_blocks ADD COLUMN description TEXT;
  END IF;

  -- created_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'availability_blocks' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE availability_blocks ADD COLUMN created_by UUID REFERENCES users(id);
  END IF;
END $$;

-- Crear índices si no existen
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

-- Agregar constraint si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'availability_blocks_block_type_check'
  ) THEN
    ALTER TABLE availability_blocks ADD CONSTRAINT availability_blocks_block_type_check
      CHECK (block_type IN ('manual', 'vacation', 'event', 'maintenance', 'google_calendar'));
  END IF;
EXCEPTION
  WHEN others THEN NULL; -- Ignorar si ya existe
END $$;

-- ========================================
-- 2. ARREGLAR salon_profiles (Google Calendar)
-- ========================================

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

-- ========================================
-- 3. ARREGLAR reservations (Google Calendar)
-- ========================================

-- Agregar google_event_id a reservations
ALTER TABLE reservations 
  ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_reservations_google_event 
  ON reservations(google_event_id) 
  WHERE google_event_id IS NOT NULL;

-- ========================================
-- 4. FIX TIMESTAMPS (TIMESTAMPTZ)
-- ========================================

-- Cambiar a TIMESTAMPTZ solo si aún no lo es
DO $$
BEGIN
  -- reservations.start_time
  IF (SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'reservations' AND column_name = 'start_time') = 'timestamp without time zone' THEN
    ALTER TABLE reservations 
      ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'UTC';
  END IF;

  -- reservations.end_time
  IF (SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'reservations' AND column_name = 'end_time') = 'timestamp without time zone' THEN
    ALTER TABLE reservations 
      ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time AT TIME ZONE 'UTC';
  END IF;

  -- availability_blocks.start_time
  IF (SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'availability_blocks' AND column_name = 'start_time') = 'timestamp without time zone' THEN
    ALTER TABLE availability_blocks 
      ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'UTC';
  END IF;

  -- availability_blocks.end_time
  IF (SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'availability_blocks' AND column_name = 'end_time') = 'timestamp without time zone' THEN
    ALTER TABLE availability_blocks 
      ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time AT TIME ZONE 'UTC';
  END IF;
END $$;

-- ========================================
-- 5. VERIFICACIÓN FINAL
-- ========================================

-- Mostrar columnas de availability_blocks
SELECT 
  'availability_blocks' as tabla,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'availability_blocks'
ORDER BY ordinal_position;

-- Mostrar columnas Google Calendar de salon_profiles
SELECT 
  'salon_profiles (google)' as tabla,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'salon_profiles' 
  AND column_name LIKE 'google%'
ORDER BY column_name;

-- Mostrar columna google_event_id en reservations
SELECT 
  'reservations (google)' as tabla,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'reservations' 
  AND column_name = 'google_event_id';

-- Mostrar tipos de timestamp
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('reservations', 'availability_blocks')
  AND column_name IN ('start_time', 'end_time')
ORDER BY table_name, column_name;

