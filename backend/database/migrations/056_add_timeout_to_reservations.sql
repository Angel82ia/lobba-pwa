
ALTER TABLE reservations 
  ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMP,
  ADD COLUMN IF NOT EXISTS auto_cancelled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_cancel_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_reservations_pending_deadline 
  ON reservations(status, confirmation_deadline) 
  WHERE status = 'pending' AND confirmation_deadline IS NOT NULL;

COMMENT ON COLUMN reservations.confirmation_deadline IS 'Deadline para confirmar reserva (2h desde creación). Después se auto-cancela.';
COMMENT ON COLUMN reservations.auto_cancelled IS 'Si la reserva fue cancelada automáticamente por timeout';
COMMENT ON COLUMN reservations.auto_cancel_reason IS 'Razón de cancelación automática (timeout, overbooking, etc)';
