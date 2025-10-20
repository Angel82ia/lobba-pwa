
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

COMMENT ON COLUMN salon_profiles.google_calendar_id IS 'ID del calendario de Google vinculado';
COMMENT ON COLUMN salon_profiles.google_calendar_enabled IS 'Si Google Calendar está habilitado';
COMMENT ON COLUMN salon_profiles.google_sync_enabled IS 'Si la sincronización bidireccional está activa';
COMMENT ON COLUMN salon_profiles.google_webhook_channel_id IS 'ID del canal webhook de Google Calendar';
COMMENT ON COLUMN salon_profiles.google_webhook_resource_id IS 'ID del recurso monitoreado por webhook';
COMMENT ON COLUMN salon_profiles.last_google_sync IS 'Última sincronización exitosa con Google Calendar';
