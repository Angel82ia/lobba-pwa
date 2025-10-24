-- Cambiar columnas TIMESTAMP a TIMESTAMPTZ para mantener zona horaria
-- Esto es importante para que las fechas se guarden con información de zona horaria

-- Reservations table
ALTER TABLE reservations
  ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'UTC',
  ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time AT TIME ZONE 'UTC',
  ALTER COLUMN confirmed_at TYPE TIMESTAMPTZ USING confirmed_at AT TIME ZONE 'UTC',
  ALTER COLUMN completed_at TYPE TIMESTAMPTZ USING completed_at AT TIME ZONE 'UTC',
  ALTER COLUMN cancelled_at TYPE TIMESTAMPTZ USING cancelled_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Availability blocks table
ALTER TABLE availability_blocks
  ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'UTC',
  ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

COMMENT ON COLUMN reservations.start_time IS 'Fecha/hora inicio con zona horaria';
COMMENT ON COLUMN reservations.end_time IS 'Fecha/hora fin con zona horaria';

