CREATE TABLE IF NOT EXISTS salon_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  parent_category_id UUID REFERENCES salon_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salon_category_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_profile_id UUID NOT NULL REFERENCES salon_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES salon_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_salon_category UNIQUE(salon_profile_id, category_id)
);

CREATE INDEX idx_salon_categories_slug ON salon_categories(slug);
CREATE INDEX idx_salon_categories_active ON salon_categories(is_active);
CREATE INDEX idx_salon_category_assignments_salon ON salon_category_assignments(salon_profile_id);
CREATE INDEX idx_salon_category_assignments_category ON salon_category_assignments(category_id);

INSERT INTO salon_categories (name, slug, description, icon, sort_order) VALUES
  ('Belleza', 'belleza', 'Servicios de belleza y estética', 'sparkles', 1),
  ('Peluquería', 'peluqueria', 'Servicios de corte, peinado y tratamientos capilares', 'scissors', 2),
  ('Barbería', 'barberia', 'Servicios especializados para hombres', 'razor', 3),
  ('Manicura y Pedicura', 'manicura-pedicura', 'Servicios de uñas', 'hand', 4),
  ('Spa y Masajes', 'spa-masajes', 'Tratamientos de relajación y bienestar', 'spa', 5),
  ('Estética Avanzada', 'estetica-avanzada', 'Tratamientos faciales y corporales', 'face', 6),
  ('Maquillaje', 'maquillaje', 'Servicios de maquillaje profesional', 'makeup', 7),
  ('Depilación', 'depilacion', 'Servicios de depilación', 'wax', 8),
  ('Tatuajes y Piercings', 'tatuajes-piercings', 'Arte corporal', 'tattoo', 9),
  ('Otros', 'otros', 'Otros servicios', 'more', 99)
ON CONFLICT (slug) DO NOTHING;
