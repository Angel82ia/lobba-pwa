
ALTER TABLE salons 
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_salons_contact_phone ON salons(contact_phone);

COMMENT ON COLUMN salons.contact_phone IS 
'Número de WhatsApp donde el salón recibe notificaciones automáticas del sistema LOBBA. Formato: +34XXXXXXXXX';
