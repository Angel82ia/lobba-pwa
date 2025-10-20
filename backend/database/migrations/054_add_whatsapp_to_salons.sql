
ALTER TABLE salon_profiles 
  ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_salon_profiles_whatsapp_enabled 
  ON salon_profiles(whatsapp_enabled) 
  WHERE whatsapp_enabled = true;

COMMENT ON COLUMN salon_profiles.whatsapp_number IS 'Número WhatsApp del salón para click-to-chat (formato: +34XXXXXXXXX)';
COMMENT ON COLUMN salon_profiles.whatsapp_enabled IS 'Si el salón tiene WhatsApp habilitado para contacto directo';
