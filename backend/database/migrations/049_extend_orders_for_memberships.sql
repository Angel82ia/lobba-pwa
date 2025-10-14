
ALTER TABLE orders ADD COLUMN IF NOT EXISTS membership_discount JSONB;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS powerbank_penalties JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_orders_membership_discount ON orders USING GIN (membership_discount);
CREATE INDEX IF NOT EXISTS idx_orders_powerbank_penalties ON orders USING GIN (powerbank_penalties);

COMMENT ON COLUMN orders.membership_discount IS 'JSON: {user_id, membership_type, discount_percentage, discount_amount, free_shipping, shipping_threshold, nail_prints_count, nail_prints_deducted}';
COMMENT ON COLUMN orders.powerbank_penalties IS 'JSON array: [{loan_id, amount, reason}] for powerbank late return penalties';
