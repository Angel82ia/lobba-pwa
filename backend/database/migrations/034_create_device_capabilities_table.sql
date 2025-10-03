CREATE TABLE IF NOT EXISTS device_capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID NOT NULL REFERENCES device_profiles(id) ON DELETE CASCADE,
  capability_type VARCHAR(50) NOT NULL CHECK (capability_type IN ('dispense', 'accept_return', 'print', 'scan_qr')),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(device_id, capability_type)
);

CREATE INDEX idx_device_capabilities_device ON device_capabilities(device_id);
CREATE INDEX idx_device_capabilities_type ON device_capabilities(capability_type);
CREATE INDEX idx_device_capabilities_active ON device_capabilities(is_active);
