CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  image_url TEXT,
  is_consumable BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  monthly_limit INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_active ON items(is_active);
CREATE INDEX idx_items_consumable ON items(is_consumable);
