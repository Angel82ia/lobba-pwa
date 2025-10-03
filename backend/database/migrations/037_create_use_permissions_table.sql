CREATE TABLE IF NOT EXISTS use_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES device_profiles(id),
  item_id UUID REFERENCES items(id),
  equipment_id UUID REFERENCES equipment(id),
  permission_type VARCHAR(50) CHECK (permission_type IN ('dispense', 'pickup', 'return')) NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  status VARCHAR(50) CHECK (status IN ('pending', 'used', 'expired', 'cancelled')) DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_item_or_equipment CHECK (
    (item_id IS NOT NULL AND equipment_id IS NULL) OR
    (item_id IS NULL AND equipment_id IS NOT NULL)
  )
);

CREATE INDEX idx_use_permissions_user ON use_permissions(user_id);
CREATE INDEX idx_use_permissions_device ON use_permissions(device_id);
CREATE INDEX idx_use_permissions_token ON use_permissions(token);
CREATE INDEX idx_use_permissions_status ON use_permissions(status);
CREATE INDEX idx_use_permissions_expires ON use_permissions(expires_at);
