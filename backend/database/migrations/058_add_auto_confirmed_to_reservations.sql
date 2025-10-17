
ALTER TABLE reservations 
  ADD COLUMN IF NOT EXISTS auto_confirmed BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_reservations_auto_confirmed 
  ON reservations(auto_confirmed) 
  WHERE auto_confirmed = true;

COMMENT ON COLUMN reservations.auto_confirmed IS 'Si la reserva fue confirmada automáticamente (vs manual)';
