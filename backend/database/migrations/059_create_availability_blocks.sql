
CREATE TABLE IF NOT EXISTS availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_profile_id UUID NOT NULL REFERENCES salon_profiles(id) ON DELETE CASCADE,
  
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  
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

COMMENT ON TABLE availability_blocks IS 'Bloqueos manuales de disponibilidad (vacaciones, eventos, etc)';
COMMENT ON COLUMN availability_blocks.block_type IS 'Tipo: manual, vacation, event, maintenance, google_calendar';
COMMENT ON COLUMN availability_blocks.google_calendar_event_id IS 'ID del evento de Google Calendar si aplica';
COMMENT ON COLUMN availability_blocks.recurrence_rule IS 'Regla de recurrencia en formato RRULE (futuro)';
