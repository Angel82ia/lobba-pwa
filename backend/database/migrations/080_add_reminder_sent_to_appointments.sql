
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_sent ON appointments(reminder_sent, appointment_date);

COMMENT ON COLUMN appointments.reminder_sent IS 'Indica si se envió recordatorio 24h antes';
COMMENT ON COLUMN appointments.reminder_sent_at IS 'Timestamp de cuando se envió el recordatorio';
