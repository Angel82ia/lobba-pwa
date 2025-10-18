
CREATE TABLE IF NOT EXISTS user_animations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  before_image_url VARCHAR(500) NOT NULL,
  after_image_url VARCHAR(500) NOT NULL,
  before_image_thumbnail VARCHAR(500),
  after_image_thumbnail VARCHAR(500),
  
  animation_video_url VARCHAR(500),
  
  animation_type VARCHAR(50) DEFAULT 'crossfade' CHECK (
    animation_type IN ('crossfade', 'slide', 'fade', 'zoom')
  ),
  animation_duration INTEGER DEFAULT 2500 CHECK (
    animation_duration >= 1000 AND animation_duration <= 5000
  ),
  
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_animations_user_id 
  ON user_animations(user_id);

CREATE INDEX IF NOT EXISTS idx_user_animations_active 
  ON user_animations(is_active) WHERE is_active = true;

CREATE OR REPLACE FUNCTION update_user_animations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_animations_updated_at
  BEFORE UPDATE ON user_animations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_animations_updated_at();

COMMENT ON TABLE user_animations IS 'Animaciones personalizadas de maquillaje por usuario';
COMMENT ON COLUMN user_animations.user_id IS 'ID del usuario propietario (unique)';
COMMENT ON COLUMN user_animations.before_image_url IS 'URL imagen sin maquillaje';
COMMENT ON COLUMN user_animations.after_image_url IS 'URL imagen con maquillaje';
COMMENT ON COLUMN user_animations.animation_type IS 'Tipo de transición: crossfade, slide, fade, zoom';
COMMENT ON COLUMN user_animations.animation_duration IS 'Duración en milisegundos (1000-5000)';
COMMENT ON COLUMN user_animations.is_active IS 'Si false, usuario eliminó su animación';
