CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_profile_id UUID NOT NULL REFERENCES salon_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) CHECK (type IN ('oferta', 'evento', 'descuento', 'noticia')),
  targeting_type VARCHAR(50) CHECK (targeting_type IN ('own_clients', 'geographic')) NOT NULL,
  radius_km INTEGER,
  center_location GEOGRAPHY(Point, 4326),
  sent_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('pending', 'sending', 'sent', 'failed')) DEFAULT 'pending',
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_salon ON notifications(salon_profile_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_location ON notifications USING GIST(center_location);
