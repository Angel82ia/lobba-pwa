CREATE TABLE IF NOT EXISTS notification_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_profile_id UUID NOT NULL REFERENCES salon_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(salon_profile_id, date)
);

CREATE INDEX idx_notification_rate_limits_salon ON notification_rate_limits(salon_profile_id);
CREATE INDEX idx_notification_rate_limits_date ON notification_rate_limits(date);
