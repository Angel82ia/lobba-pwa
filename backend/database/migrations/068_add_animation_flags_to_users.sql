
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS has_custom_animation BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS animation_enabled BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_users_has_animation 
  ON users(has_custom_animation) WHERE has_custom_animation = true;

COMMENT ON COLUMN users.has_custom_animation IS 'True si el usuario tiene animación personalizada activa';
COMMENT ON COLUMN users.animation_enabled IS 'True si el usuario quiere ver su animación al login';
