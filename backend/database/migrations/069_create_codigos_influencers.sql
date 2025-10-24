
CREATE TABLE IF NOT EXISTS codigos_influencers (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre_influencer VARCHAR(100) NOT NULL,
  email_influencer VARCHAR(100) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT codigo_uppercase CHECK (codigo = UPPER(codigo)),
  CONSTRAINT codigo_alphanumeric CHECK (codigo ~ '^[A-Z0-9]+$')
);

CREATE INDEX IF NOT EXISTS idx_codigo_activo ON codigos_influencers(codigo, activo);

INSERT INTO codigos_influencers (codigo, nombre_influencer, email_influencer) 
VALUES 
  ('TEST2024', 'Test Influencer', 'test@lobba.com'),
  ('MARIA2024', 'María García', 'maria@email.com')
ON CONFLICT (codigo) DO NOTHING;

COMMENT ON TABLE codigos_influencers IS 'Tabla de códigos de referido para influencers';
COMMENT ON COLUMN codigos_influencers.codigo IS 'Código único de referido (mayúsculas y números)';
COMMENT ON COLUMN codigos_influencers.activo IS 'Indica si el código está activo para nuevos registros';
