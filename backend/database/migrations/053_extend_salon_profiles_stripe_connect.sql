
ALTER TABLE salon_profiles
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarded BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_created_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS stripe_connect_updated_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_salon_stripe_account ON salon_profiles(stripe_connect_account_id);
CREATE INDEX IF NOT EXISTS idx_salon_stripe_enabled ON salon_profiles(stripe_connect_enabled);

COMMENT ON COLUMN salon_profiles.stripe_connect_account_id IS 'ID de cuenta Stripe Connect del salón';
COMMENT ON COLUMN salon_profiles.stripe_connect_onboarded IS 'Si completó el proceso de onboarding de Stripe';
COMMENT ON COLUMN salon_profiles.stripe_connect_enabled IS 'Si la cuenta Stripe está habilitada y puede recibir pagos';
COMMENT ON COLUMN salon_profiles.stripe_connect_charges_enabled IS 'Si puede procesar cargos (activado por Stripe tras verificación)';
COMMENT ON COLUMN salon_profiles.stripe_connect_payouts_enabled IS 'Si puede recibir transferencias (activado por Stripe tras verificación)';
