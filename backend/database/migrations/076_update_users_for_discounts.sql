
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tipo_descuento_aplicado VARCHAR(30) DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tipo_desc_valido' AND table_name = 'users'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT tipo_desc_valido
    CHECK (tipo_descuento_aplicado IN ('referido_amigas', 'codigo_influencer', 'ninguno', NULL));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_tipo_descuento ON users(tipo_descuento_aplicado);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS ha_usado_codigo_compra BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_codigo_compra ON users(ha_usado_codigo_compra) WHERE ha_usado_codigo_compra = TRUE;

COMMENT ON COLUMN users.tipo_descuento_aplicado IS 'Tipo de descuento aplicado en primera cuota: referido_amigas (prioridad 1), codigo_influencer (prioridad 2), ninguno';
COMMENT ON COLUMN users.ha_usado_codigo_compra IS 'TRUE si ya usó un código de descuento en compras (uso único de por vida)';
