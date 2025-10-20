
CREATE TABLE IF NOT EXISTS codigos_descuento (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  influencer_id INT REFERENCES codigos_influencers(id) ON DELETE CASCADE,
  
  porcentaje_descuento DECIMAL(5,2) NOT NULL DEFAULT 10.00, -- Típicamente 10%
  porcentaje_comision DECIMAL(5,2) NOT NULL DEFAULT 15.00, -- Comisión para influencer
  
  activo BOOLEAN DEFAULT TRUE,
  
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion TIMESTAMP NULL,
  
  -- Constraints
  CONSTRAINT codigo_uppercase CHECK (codigo = UPPER(codigo)),
  CONSTRAINT codigo_alphanumeric CHECK (codigo ~ '^[A-Z0-9]+$'),
  CONSTRAINT descuento_valido CHECK (porcentaje_descuento BETWEEN 5 AND 15),
  CONSTRAINT comision_valida CHECK (porcentaje_comision BETWEEN 5 AND 20)
);

CREATE INDEX IF NOT EXISTS idx_cod_desc_codigo ON codigos_descuento(codigo, activo);
CREATE INDEX IF NOT EXISTS idx_cod_desc_influencer ON codigos_descuento(influencer_id);
CREATE INDEX IF NOT EXISTS idx_cod_desc_activo ON codigos_descuento(activo) WHERE activo = TRUE;

INSERT INTO codigos_descuento (codigo, influencer_id, porcentaje_descuento, porcentaje_comision)
SELECT 'MARIA10', id, 10.00, 15.00 
FROM codigos_influencers 
WHERE codigo = 'MARIA2024'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO codigos_descuento (codigo, influencer_id, porcentaje_descuento, porcentaje_comision)
SELECT 'TEST10', id, 10.00, 15.00 
FROM codigos_influencers 
WHERE codigo = 'TEST2024'
ON CONFLICT (codigo) DO NOTHING;

COMMENT ON TABLE codigos_descuento IS 'Códigos de descuento para COMPRAS (se suman al descuento base de membresía)';
COMMENT ON COLUMN codigos_descuento.porcentaje_descuento IS 'Descuento adicional que se suma al descuento base (típicamente 10%)';
COMMENT ON COLUMN codigos_descuento.porcentaje_comision IS 'Porcentaje de comisión para el influencer sobre el descuento aplicado';
COMMENT ON COLUMN codigos_descuento.fecha_expiracion IS 'NULL = sin expiración';
