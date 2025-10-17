
ALTER TABLE salon_profiles 
  ADD COLUMN IF NOT EXISTS simultaneous_capacity INTEGER DEFAULT 1 CHECK (simultaneous_capacity >= 1),
  ADD COLUMN IF NOT EXISTS capacity_enabled BOOLEAN DEFAULT false;

UPDATE salon_profiles 
SET simultaneous_capacity = 1, 
    capacity_enabled = true 
WHERE simultaneous_capacity IS NULL;

CREATE INDEX IF NOT EXISTS idx_salon_profiles_capacity 
  ON salon_profiles(id, simultaneous_capacity, capacity_enabled) 
  WHERE capacity_enabled = true;

COMMENT ON COLUMN salon_profiles.simultaneous_capacity IS 'Número de reservas simultáneas permitidas (default: 1 = no overlapping)';
COMMENT ON COLUMN salon_profiles.capacity_enabled IS 'Si el salón usa sistema de capacidad (permite overlapping controlado)';
