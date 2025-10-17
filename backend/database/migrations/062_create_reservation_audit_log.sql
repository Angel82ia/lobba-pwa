
CREATE TABLE IF NOT EXISTS reservation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  action VARCHAR(50) NOT NULL CHECK (
    action IN ('created', 'modified', 'confirmed', 'cancelled', 'completed', 'no_show', 'refunded')
  ),
  
  changes JSONB,
  
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_reservation 
  ON reservation_audit_log(reservation_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_user 
  ON reservation_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_action 
  ON reservation_audit_log(action);

CREATE INDEX IF NOT EXISTS idx_audit_log_created 
  ON reservation_audit_log(created_at DESC);

COMMENT ON TABLE reservation_audit_log IS 'Registro de auditoría de todas las acciones sobre reservas';
COMMENT ON COLUMN reservation_audit_log.action IS 'Tipo de acción: created, modified, confirmed, cancelled, completed, no_show, refunded';
COMMENT ON COLUMN reservation_audit_log.changes IS 'Objeto JSON con los cambios realizados (antes/después)';
COMMENT ON COLUMN reservation_audit_log.reason IS 'Razón de la acción (cancelación, etc)';
