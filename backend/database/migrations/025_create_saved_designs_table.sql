CREATE TABLE IF NOT EXISTS saved_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES ai_generations(id) ON DELETE CASCADE,
  title VARCHAR(255),
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, generation_id)
);

CREATE INDEX idx_saved_designs_user ON saved_designs(user_id);
CREATE INDEX idx_saved_designs_generation ON saved_designs(generation_id);
CREATE INDEX idx_saved_designs_favorite ON saved_designs(is_favorite);
