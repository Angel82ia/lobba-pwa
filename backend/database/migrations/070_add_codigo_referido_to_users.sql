
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS codigo_referido VARCHAR(20) DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'fecha_registro'
  ) THEN
    ALTER TABLE users ADD COLUMN fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_codigo_referido ON users(codigo_referido);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'codigos_influencers') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_codigo_referido'
    ) THEN
      ALTER TABLE users DROP CONSTRAINT fk_codigo_referido;
    END IF;
    
    ALTER TABLE users
    ADD CONSTRAINT fk_codigo_referido 
    FOREIGN KEY (codigo_referido) 
    REFERENCES codigos_influencers(codigo)
    ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON COLUMN users.codigo_referido IS 'Código de referido del influencer que trajo al usuario';
COMMENT ON COLUMN users.fecha_registro IS 'Fecha de registro del usuario (puede ser igual a created_at)';
