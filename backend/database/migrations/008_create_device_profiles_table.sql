CREATE TABLE IF NOT EXISTS device_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) NOT NULL,
  
  location GEOGRAPHY(Point, 4326),
  address TEXT,
  city VARCHAR(100),
  
  capabilities JSONB NOT NULL DEFAULT '[]',
  
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  last_ping_at TIMESTAMP,
  firmware_version VARCHAR(50),
  
  current_stock JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_user_device UNIQUE(user_id)
);

CREATE INDEX idx_device_profiles_user_id ON device_profiles(user_id);
CREATE INDEX idx_device_profiles_location ON device_profiles USING GIST(location);
CREATE INDEX idx_device_profiles_active ON device_profiles(is_active);
CREATE INDEX idx_device_profiles_online ON device_profiles(is_online);
CREATE INDEX idx_device_profiles_type ON device_profiles(device_type);

CREATE OR REPLACE FUNCTION update_device_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_profiles_updated_at
  BEFORE UPDATE ON device_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_device_profile_updated_at();
