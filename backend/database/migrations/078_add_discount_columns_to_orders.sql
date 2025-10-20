
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS code_discount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS code_applied VARCHAR(50),
  ADD COLUMN IF NOT EXISTS total_discount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS influencer_commission DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN orders.code_discount IS 'Descuento aplicado por código de influencer en euros';
COMMENT ON COLUMN orders.code_applied IS 'Código de descuento aplicado (si existe)';
COMMENT ON COLUMN orders.total_discount IS 'Descuento total aplicado (membresía + código)';
COMMENT ON COLUMN orders.influencer_commission IS 'Comisión generada para el influencer en euros';
