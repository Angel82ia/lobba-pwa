CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('nails', 'hairstyle')) NOT NULL,
  prompt TEXT,
  input_image_url TEXT,
  output_image_url TEXT NOT NULL,
  style_id VARCHAR(100),
  ai_provider VARCHAR(50),
  generation_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_generations_user ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_type ON ai_generations(type);
CREATE INDEX idx_ai_generations_created_at ON ai_generations(created_at);
