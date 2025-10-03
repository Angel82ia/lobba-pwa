CREATE TABLE IF NOT EXISTS device_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID NOT NULL REFERENCES device_profiles(id),
  user_id UUID REFERENCES users(id),
  permission_id UUID REFERENCES use_permissions(id),
  event_type VARCHAR(50) CHECK (event_type IN ('dispense', 'pickup', 'return', 'scan', 'error')) NOT NULL,
  status VARCHAR(50) CHECK (status IN ('success', 'fail', 'pending')) NOT NULL,
  item_id UUID REFERENCES items(id),
  equipment_id UUID REFERENCES equipment(id),
  telemetry JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_device_events_device ON device_events(device_id);
CREATE INDEX idx_device_events_user ON device_events(user_id);
CREATE INDEX idx_device_events_type ON device_events(event_type);
CREATE INDEX idx_device_events_status ON device_events(status);
CREATE INDEX idx_device_events_created ON device_events(created_at DESC);
