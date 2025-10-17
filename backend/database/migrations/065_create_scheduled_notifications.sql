
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  
  template_key VARCHAR(100) NOT NULL,
  
  recipient_id UUID REFERENCES users(id),
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),
  
  template_variables JSONB,
  
  scheduled_at TIMESTAMP NOT NULL,
  
  status VARCHAR(50) DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'failed', 'cancelled')
  ),
  
  sent_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,
  cancelled_at TIMESTAMP,
  
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_reservation 
  ON scheduled_notifications(reservation_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled 
  ON scheduled_notifications(scheduled_at) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status 
  ON scheduled_notifications(status);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_retry 
  ON scheduled_notifications(next_retry_at) 
  WHERE status = 'failed' AND retry_count < max_retries;

CREATE OR REPLACE FUNCTION update_scheduled_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scheduled_notifications_updated_at
  BEFORE UPDATE ON scheduled_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_notifications_updated_at();

COMMENT ON TABLE scheduled_notifications IS 'Notificaciones programadas (recordatorios, etc)';
COMMENT ON COLUMN scheduled_notifications.scheduled_at IS 'Cuándo enviar la notificación';
COMMENT ON COLUMN scheduled_notifications.status IS 'Estado: pending, sent, failed, cancelled';
COMMENT ON COLUMN scheduled_notifications.retry_count IS 'Número de reintentos realizados';
