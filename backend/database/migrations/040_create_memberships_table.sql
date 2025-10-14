CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) CHECK (plan_type IN ('spirit', 'essential')) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('active', 'suspended', 'expired', 'cancelled')) NOT NULL DEFAULT 'active',
  start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiry_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  payment_method VARCHAR(50),
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  price_paid DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'EUR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_memberships_plan_type ON memberships(plan_type);
CREATE INDEX idx_memberships_expiry_date ON memberships(expiry_date);
CREATE INDEX idx_memberships_stripe_subscription_id ON memberships(stripe_subscription_id);

CREATE UNIQUE INDEX idx_memberships_user_active 
ON memberships(user_id) 
WHERE status = 'active';
