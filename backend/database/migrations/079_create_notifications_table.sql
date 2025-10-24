
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  to_phone VARCHAR(20),
  to_email VARCHAR(255),
  message_sid VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  content TEXT,
  error_code VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_appointment ON notifications(appointment_id);
CREATE INDEX idx_notifications_message_sid ON notifications(message_sid);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

COMMENT ON TABLE notifications IS 'Tracking de notificaciones enviadas via Twilio WhatsApp y SendGrid Email';
COMMENT ON COLUMN notifications.type IS 'Tipo: appointment_confirmation, appointment_reminder, appointment_cancellation, salon_notification, password_reset, welcome';
COMMENT ON COLUMN notifications.message_sid IS 'Twilio Message SID para tracking';
COMMENT ON COLUMN notifications.status IS 'Estado: pending, sent, delivered, failed, read (desde webhook Twilio)';
