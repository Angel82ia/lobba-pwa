CREATE TABLE IF NOT EXISTS salon_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_profile_id UUID NOT NULL REFERENCES salon_profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES salon_categories(id) ON DELETE SET NULL,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  discount_percentage INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  requires_deposit BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(10, 2),
  
  max_advance_booking_days INTEGER DEFAULT 90,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_salon_services_salon ON salon_services(salon_profile_id);
CREATE INDEX idx_salon_services_category ON salon_services(category_id);
CREATE INDEX idx_salon_services_active ON salon_services(is_active);
CREATE INDEX idx_salon_services_price ON salon_services(price);

CREATE OR REPLACE FUNCTION update_salon_service_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER salon_services_updated_at
  BEFORE UPDATE ON salon_services
  FOR EACH ROW
  EXECUTE FUNCTION update_salon_service_updated_at();
