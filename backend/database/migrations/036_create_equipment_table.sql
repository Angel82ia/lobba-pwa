CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  image_url TEXT,
  requires_return BOOLEAN DEFAULT true,
  max_loan_days INTEGER DEFAULT 7,
  current_location UUID REFERENCES device_profiles(id),
  status VARCHAR(50) CHECK (status IN ('available', 'on_loan', 'maintenance', 'retired')) DEFAULT 'available',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_location ON equipment(current_location);
CREATE INDEX idx_equipment_active ON equipment(is_active);
CREATE INDEX idx_equipment_category ON equipment(category);
