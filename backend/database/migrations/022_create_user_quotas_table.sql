CREATE TABLE IF NOT EXISTS user_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nails_quota_used INTEGER DEFAULT 0,
  nails_quota_limit INTEGER DEFAULT 100,
  hairstyle_quota_used INTEGER DEFAULT 0,
  hairstyle_quota_limit INTEGER DEFAULT 4,
  quota_reset_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_user_quotas_user ON user_quotas(user_id);
CREATE INDEX idx_user_quotas_reset_date ON user_quotas(quota_reset_date);

CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
  UPDATE user_quotas
  SET nails_quota_used = 0,
      hairstyle_quota_used = 0,
      quota_reset_date = DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month'),
      updated_at = CURRENT_TIMESTAMP
  WHERE quota_reset_date <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
