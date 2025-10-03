CREATE TABLE IF NOT EXISTS design_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  catalog_item_id UUID NOT NULL REFERENCES ai_catalog(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(catalog_item_id, user_id)
);

CREATE INDEX idx_design_ratings_catalog_item ON design_ratings(catalog_item_id);
CREATE INDEX idx_design_ratings_user ON design_ratings(user_id);
CREATE INDEX idx_design_ratings_rating ON design_ratings(rating);
