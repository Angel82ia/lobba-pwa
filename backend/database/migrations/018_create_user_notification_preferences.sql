CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  types_enabled TEXT[] DEFAULT ARRAY['oferta', 'evento', 'descuento', 'noticia'],
  max_radius_km INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_notification_prefs_user ON user_notification_preferences(user_id);
CREATE INDEX idx_notification_prefs_enabled ON user_notification_preferences(notifications_enabled);
