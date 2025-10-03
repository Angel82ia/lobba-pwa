CREATE TABLE IF NOT EXISTS ai_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) CHECK (type IN ('nails', 'hairstyle')) NOT NULL,
  style_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  preview_image_url TEXT NOT NULL,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_catalog_type ON ai_catalog(type);
CREATE INDEX idx_ai_catalog_style_id ON ai_catalog(style_id);
CREATE INDEX idx_ai_catalog_active ON ai_catalog(is_active);
CREATE INDEX idx_ai_catalog_tags ON ai_catalog USING GIN(tags);
