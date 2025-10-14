
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS billing_cycle INTEGER DEFAULT 1;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS is_free_month BOOLEAN DEFAULT false;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS remaining_payments INTEGER DEFAULT 12;

ALTER TABLE memberships ADD COLUMN IF NOT EXISTS can_change_membership BOOLEAN DEFAULT false;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS membership_change_allowed_from TIMESTAMP;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS previous_membership VARCHAR(20);

ALTER TABLE memberships ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;

ALTER TABLE memberships ADD COLUMN IF NOT EXISTS last_reset_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_memberships_referral_code ON memberships(referral_code);

CREATE INDEX IF NOT EXISTS idx_memberships_billing_cycle ON memberships(billing_cycle);

COMMENT ON COLUMN memberships.billing_cycle IS 'Counter of billing cycles (1, 2, 3, ...)';
COMMENT ON COLUMN memberships.is_free_month IS 'True if current month is free (from referral program)';
COMMENT ON COLUMN memberships.remaining_payments IS 'Number of payments remaining in annual subscription';
COMMENT ON COLUMN memberships.can_change_membership IS 'True if user can change membership type (after 2nd billing)';
COMMENT ON COLUMN memberships.referral_code IS 'Unique code for referring other users';
