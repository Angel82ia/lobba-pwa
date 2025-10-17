
ALTER TABLE reservations 
  DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_status_check 
  CHECK (status IN (
    'pending',           -- Esperando confirmación manual
    'confirmed',         -- Confirmada (manual o auto)
    'in_progress',       -- Cliente llegó, servicio en curso
    'completed',         -- Servicio completado exitosamente
    'cancelled',         -- Cancelada por usuario/salon
    'no_show',           -- Cliente no se presentó
    'rejected',          -- Rechazada por el salón
    'expired',           -- Expiró timeout de confirmación
    'rescheduled'        -- Fue reprogramada (histórico)
  ));

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejected_reason TEXT,
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rescheduled_to UUID REFERENCES reservations(id),
  ADD COLUMN IF NOT EXISTS rescheduled_from UUID REFERENCES reservations(id),
  ADD COLUMN IF NOT EXISTS in_progress_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS salon_notes TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_reservations_rejected_at 
  ON reservations(rejected_at) WHERE rejected_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_expired_at 
  ON reservations(expired_at) WHERE expired_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_in_progress 
  ON reservations(status, in_progress_at) WHERE status = 'in_progress';

CREATE INDEX IF NOT EXISTS idx_reservations_rescheduled 
  ON reservations(rescheduled_from) WHERE rescheduled_from IS NOT NULL;

COMMENT ON COLUMN reservations.status IS 'Estado: pending, confirmed, in_progress, completed, cancelled, no_show, rejected, expired, rescheduled';
COMMENT ON COLUMN reservations.rejected_at IS 'Timestamp de rechazo por el salón';
COMMENT ON COLUMN reservations.rejected_reason IS 'Razón del rechazo';
COMMENT ON COLUMN reservations.expired_at IS 'Timestamp de expiración por timeout';
COMMENT ON COLUMN reservations.rescheduled_to IS 'ID de la nueva reserva si fue reprogramada';
COMMENT ON COLUMN reservations.rescheduled_from IS 'ID de la reserva original si es reprogramación';
COMMENT ON COLUMN reservations.in_progress_at IS 'Timestamp de inicio del servicio';
COMMENT ON COLUMN reservations.salon_notes IS 'Notas del salón (visibles para cliente)';
COMMENT ON COLUMN reservations.internal_notes IS 'Notas internas (solo salón)';
