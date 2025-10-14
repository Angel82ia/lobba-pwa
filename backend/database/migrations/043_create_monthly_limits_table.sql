
CREATE TABLE IF NOT EXISTS monthly_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  
  emergency_articles INTEGER NOT NULL DEFAULT 0,
  emergency_articles_used INTEGER NOT NULL DEFAULT 0,
  
  powerbanks INTEGER NOT NULL DEFAULT 0,
  powerbanks_used INTEGER NOT NULL DEFAULT 0,
  
  nail_prints INTEGER NOT NULL DEFAULT 0,
  nail_prints_used INTEGER NOT NULL DEFAULT 0,
  
  ems_sessions INTEGER NOT NULL DEFAULT 0,
  ems_sessions_used INTEGER NOT NULL DEFAULT 0,
  
  last_reset_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_emergency_articles_positive CHECK (emergency_articles >= 0),
  CONSTRAINT check_emergency_articles_used_valid CHECK (emergency_articles_used >= 0 AND emergency_articles_used <= emergency_articles),
  
  CONSTRAINT check_powerbanks_positive CHECK (powerbanks >= 0),
  CONSTRAINT check_powerbanks_used_valid CHECK (powerbanks_used >= 0 AND powerbanks_used <= powerbanks),
  
  CONSTRAINT check_nail_prints_positive CHECK (nail_prints >= 0),
  CONSTRAINT check_nail_prints_used_valid CHECK (nail_prints_used >= 0 AND nail_prints_used <= nail_prints),
  
  CONSTRAINT check_ems_sessions_positive CHECK (ems_sessions >= 0),
  CONSTRAINT check_ems_sessions_used_valid CHECK (ems_sessions_used >= 0 AND ems_sessions_used <= ems_sessions)
);

CREATE INDEX idx_monthly_limits_membership_id ON monthly_limits(membership_id);

CREATE UNIQUE INDEX idx_monthly_limits_unique_membership ON monthly_limits(membership_id);

CREATE OR REPLACE FUNCTION update_monthly_limits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_monthly_limits_updated
BEFORE UPDATE ON monthly_limits
FOR EACH ROW
EXECUTE PROCEDURE update_monthly_limits_timestamp();

COMMENT ON TABLE monthly_limits IS 'Tracks monthly usage limits for membership benefits';
COMMENT ON COLUMN monthly_limits.emergency_articles IS 'Total emergency articles allowed per month (2 Essential, 4 Spirit)';
COMMENT ON COLUMN monthly_limits.emergency_articles_used IS 'Number of emergency articles used this month';
COMMENT ON COLUMN monthly_limits.powerbanks IS 'Total powerbank loans allowed per month (2 Essential, 4 Spirit)';
COMMENT ON COLUMN monthly_limits.powerbanks_used IS 'Number of powerbank loans used this month';
COMMENT ON COLUMN monthly_limits.nail_prints IS 'Total nail prints allowed per cycle (100 for both)';
COMMENT ON COLUMN monthly_limits.nail_prints_used IS 'Number of nail prints used this cycle';
COMMENT ON COLUMN monthly_limits.ems_sessions IS 'Total EMS sessions allowed per month (0 Essential, 2 Spirit)';
COMMENT ON COLUMN monthly_limits.ems_sessions_used IS 'Number of EMS sessions used this month';
