
CREATE TABLE IF NOT EXISTS salon_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_profile_id UUID NOT NULL UNIQUE REFERENCES salon_profiles(id) ON DELETE CASCADE,
  
  auto_confirm_enabled BOOLEAN DEFAULT true,
  auto_confirm_min_hours INTEGER DEFAULT 2 CHECK (auto_confirm_min_hours >= 0),
  require_manual_first_booking BOOLEAN DEFAULT true,
  
  manual_approval_services JSONB DEFAULT '[]',
  
  buffer_minutes INTEGER DEFAULT 15 CHECK (buffer_minutes >= 0),
  max_advance_booking_days INTEGER DEFAULT 60 CHECK (max_advance_booking_days > 0),
  min_advance_booking_hours INTEGER DEFAULT 2 CHECK (min_advance_booking_hours >= 0),
  
  allow_user_cancellation BOOLEAN DEFAULT true,
  cancellation_min_hours INTEGER DEFAULT 24 CHECK (cancellation_min_hours >= 0),
  
  send_confirmation_email BOOLEAN DEFAULT true,
  send_reminder_whatsapp BOOLEAN DEFAULT false,
  reminder_hours_before INTEGER DEFAULT 24 CHECK (reminder_hours_before >= 0),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_salon_settings_salon_profile 
  ON salon_settings(salon_profile_id);

CREATE INDEX IF NOT EXISTS idx_salon_settings_auto_confirm 
  ON salon_settings(auto_confirm_enabled) 
  WHERE auto_confirm_enabled = true;

CREATE OR REPLACE FUNCTION update_salon_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER salon_settings_updated_at
  BEFORE UPDATE ON salon_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_salon_settings_updated_at();

COMMENT ON TABLE salon_settings IS 'Configuración personalizada por salón para autoconfirmación y políticas';
COMMENT ON COLUMN salon_settings.auto_confirm_enabled IS 'Si el salón usa autoconfirmación inteligente';
COMMENT ON COLUMN salon_settings.auto_confirm_min_hours IS 'Horas mínimas de antelación para autoconfirmar';
COMMENT ON COLUMN salon_settings.require_manual_first_booking IS 'Si la primera reserva de un cliente requiere confirmación manual';
COMMENT ON COLUMN salon_settings.manual_approval_services IS 'Array de service_ids que requieren aprobación manual';
COMMENT ON COLUMN salon_settings.buffer_minutes IS 'Minutos de margen entre reservas';

INSERT INTO salon_settings (salon_profile_id)
SELECT id FROM salon_profiles
WHERE id NOT IN (SELECT salon_profile_id FROM salon_settings);
