
CREATE TABLE IF NOT EXISTS referral_memberships (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  referral_campaign_id UUID REFERENCES referral_campaigns(id) ON DELETE CASCADE,
  
  es_anfitriona BOOLEAN DEFAULT FALSE,
  es_referida BOOLEAN DEFAULT FALSE,
  
  cuotas_totales INT DEFAULT 11, -- 11 cuotas por el mes gratis (en lugar de 12)
  cuotas_cobradas INT DEFAULT 0,
  
  puede_cambiar_membresia BOOLEAN DEFAULT FALSE,
  membresia_bloqueada_hasta TIMESTAMP NULL, -- Bloqueada hasta 2ª cuota
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT es_anfitriona_o_referida CHECK (es_anfitriona OR es_referida),
  CONSTRAINT cuotas_validas CHECK (cuotas_totales = 11 AND cuotas_cobradas >= 0 AND cuotas_cobradas <= 11)
);

CREATE INDEX IF NOT EXISTS idx_refmem_user ON referral_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_refmem_campaign ON referral_memberships(referral_campaign_id);
CREATE INDEX IF NOT EXISTS idx_refmem_anfitriona ON referral_memberships(es_anfitriona) WHERE es_anfitriona = TRUE;

CREATE OR REPLACE FUNCTION update_referral_memberships_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_referral_memberships_updated
BEFORE UPDATE ON referral_memberships
FOR EACH ROW
EXECUTE PROCEDURE update_referral_memberships_timestamp();

COMMENT ON TABLE referral_memberships IS 'Tracking de membresías con beneficio de programa de referidos (11 cuotas en lugar de 12)';
COMMENT ON COLUMN referral_memberships.cuotas_totales IS 'Siempre 11 (12 - 1 mes gratis)';
COMMENT ON COLUMN referral_memberships.puede_cambiar_membresia IS 'Solo puede cambiar después de 2ª cuota cobrada';
COMMENT ON COLUMN referral_memberships.membresia_bloqueada_hasta IS 'Fecha hasta la que está bloqueado el cambio de membresía';
