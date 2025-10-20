
ALTER TABLE reservations 
  ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_reservations_google_event 
  ON reservations(google_event_id) 
  WHERE google_event_id IS NOT NULL;

COMMENT ON COLUMN reservations.google_event_id IS 'ID del evento en Google Calendar si está sincronizado';
