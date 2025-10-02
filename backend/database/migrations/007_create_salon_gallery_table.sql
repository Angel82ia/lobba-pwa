CREATE TABLE IF NOT EXISTS salon_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_profile_id UUID NOT NULL REFERENCES salon_profiles(id) ON DELETE CASCADE,
  
  cloudinary_public_id VARCHAR(255) NOT NULL,
  cloudinary_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  title VARCHAR(255),
  description TEXT,
  
  sort_order INTEGER DEFAULT 0,
  is_cover_photo BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_salon_gallery_salon ON salon_gallery(salon_profile_id);
CREATE INDEX idx_salon_gallery_cover ON salon_gallery(is_cover_photo);
CREATE INDEX idx_salon_gallery_sort ON salon_gallery(sort_order);

CREATE UNIQUE INDEX idx_salon_gallery_unique_cover 
  ON salon_gallery(salon_profile_id, is_cover_photo) 
  WHERE is_cover_photo = true;
