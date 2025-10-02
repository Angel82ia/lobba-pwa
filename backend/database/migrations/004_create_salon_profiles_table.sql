CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS salon_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'España',
  phone VARCHAR(50),
  website TEXT,
  
  location GEOGRAPHY(Point, 4326),
  
  business_hours JSONB,
  
  is_click_collect BOOLEAN DEFAULT false,
  accepts_reservations BOOLEAN DEFAULT true,
  
  rating DECIMAL(2, 1) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_user_salon UNIQUE(user_id)
);

CREATE INDEX idx_salon_profiles_user_id ON salon_profiles(user_id);
CREATE INDEX idx_salon_profiles_city ON salon_profiles(city);
CREATE INDEX idx_salon_profiles_location ON salon_profiles USING GIST(location);
CREATE INDEX idx_salon_profiles_active ON salon_profiles(is_active);

CREATE OR REPLACE FUNCTION update_salon_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER salon_profiles_updated_at
  BEFORE UPDATE ON salon_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_salon_profile_updated_at();
