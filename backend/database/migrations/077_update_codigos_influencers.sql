
ALTER TABLE codigos_influencers
ADD COLUMN IF NOT EXISTS porcentaje_comision_primera_cuota DECIMAL(5,2) DEFAULT 10.00;

ALTER TABLE codigos_influencers
ADD COLUMN IF NOT EXISTS fecha_fin_contrato TIMESTAMP NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'comision_fija' AND table_name = 'codigos_influencers'
  ) THEN
    ALTER TABLE codigos_influencers
    ADD CONSTRAINT comision_fija 
    CHECK (porcentaje_comision_primera_cuota = 10.00);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_codigos_vigentes ON codigos_influencers(activo, fecha_fin_contrato)
WHERE activo = TRUE AND (fecha_fin_contrato IS NULL OR fecha_fin_contrato > CURRENT_TIMESTAMP);

UPDATE codigos_influencers 
SET porcentaje_comision_primera_cuota = 10.00 
WHERE porcentaje_comision_primera_cuota IS NULL;

COMMENT ON COLUMN codigos_influencers.porcentaje_comision_primera_cuota IS 'Comisión fija del 10% sobre precio original de primera cuota';
COMMENT ON COLUMN codigos_influencers.fecha_fin_contrato IS 'Fecha de fin de contrato con influencer (NULL = sin fin)';
