
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5, 2) DEFAULT 3.00,
  ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS amount_to_lobba DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS amount_to_commerce DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_reservations_payment_status ON reservations(payment_status);
CREATE INDEX IF NOT EXISTS idx_reservations_stripe_pi ON reservations(stripe_payment_intent_id);

COMMENT ON COLUMN reservations.commission_percentage IS 'Porcentaje de comisión LOBBA (default 3%)';
COMMENT ON COLUMN reservations.commission_amount IS 'Monto en euros de comisión LOBBA';
COMMENT ON COLUMN reservations.amount_to_lobba IS 'Cantidad que recibe LOBBA (3% del total)';
COMMENT ON COLUMN reservations.amount_to_commerce IS 'Cantidad que recibe el comercio (97% del total)';
COMMENT ON COLUMN reservations.payment_status IS 'Estado del pago: pending, processing, succeeded, failed, refunded';
COMMENT ON COLUMN reservations.stripe_payment_intent_id IS 'ID del Payment Intent de Stripe para esta reserva';
