
BEGIN;


ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ar_credits INTEGER DEFAULT 50 CHECK (ar_credits >= 0),
ADD COLUMN IF NOT EXISTS ar_credits_used INTEGER DEFAULT 0 CHECK (ar_credits_used >= 0),
ADD COLUMN IF NOT EXISTS ar_credits_reset_date TIMESTAMP DEFAULT DATE_TRUNC('month', NOW());


UPDATE users 
SET 
  ar_credits_used = LEAST(
    COALESCE(
      (SELECT nails_quota_used FROM user_quotas WHERE user_quotas.user_id = users.id),
      0
    ) + 
    COALESCE(
      (SELECT hairstyle_quota_used FROM user_quotas WHERE user_quotas.user_id = users.id),
      0
    ),
    50  -- Máximo 50 créditos usados
  ),
  ar_credits_reset_date = COALESCE(
    (SELECT quota_reset_date FROM user_quotas WHERE user_quotas.user_id = users.id),
    DATE_TRUNC('month', NOW())
  )
WHERE EXISTS (SELECT 1 FROM user_quotas WHERE user_quotas.user_id = users.id);


CREATE INDEX IF NOT EXISTS idx_users_ar_credits 
ON users(ar_credits_used, ar_credits_reset_date)
WHERE ar_credits_used > 0;


ALTER TABLE users 
ADD CONSTRAINT check_ar_credits_valid 
CHECK (ar_credits_used <= ar_credits);


CREATE TABLE IF NOT EXISTS ar_credits_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_type VARCHAR(20) NOT NULL CHECK (feature_type IN ('nails', 'hairstyle', 'makeup')),
  credits_consumed INTEGER DEFAULT 1 CHECK (credits_consumed > 0),
  credits_remaining INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ar_usage_user ON ar_credits_usage_log(user_id, created_at DESC);
CREATE INDEX idx_ar_usage_feature ON ar_credits_usage_log(feature_type);
CREATE INDEX idx_ar_usage_created ON ar_credits_usage_log(created_at);


CREATE OR REPLACE VIEW ar_credits_stats AS
SELECT 
  user_id,
  COUNT(*) as total_uses,
  SUM(CASE WHEN feature_type = 'nails' THEN credits_consumed ELSE 0 END) as nails_count,
  SUM(CASE WHEN feature_type = 'hairstyle' THEN credits_consumed ELSE 0 END) as hairstyle_count,
  SUM(CASE WHEN feature_type = 'makeup' THEN credits_consumed ELSE 0 END) as makeup_count,
  MAX(created_at) as last_use,
  DATE_TRUNC('month', MAX(created_at)) as usage_month
FROM ar_credits_usage_log
WHERE created_at >= DATE_TRUNC('month', NOW())
GROUP BY user_id;


CREATE OR REPLACE FUNCTION reset_monthly_ar_credits()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE users 
  SET ar_credits_used = 0,
      ar_credits_reset_date = NOW(),
      updated_at = NOW()
  WHERE DATE_TRUNC('month', ar_credits_reset_date) < DATE_TRUNC('month', NOW())
    AND ar_credits_used > 0;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  INSERT INTO audit_logs (event, description, metadata, created_at)
  VALUES (
    'AR_CREDITS_MONTHLY_RESET',
    'Reset mensual automático de créditos AR',
    jsonb_build_object(
      'affected_users', affected_rows,
      'reset_date', NOW()
    ),
    NOW()
  );
  
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION consume_ar_credits(
  p_user_id UUID,
  p_feature_type VARCHAR(20),
  p_credits INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(
  success BOOLEAN,
  remaining_credits INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_available INTEGER;
  v_reset_needed BOOLEAN;
BEGIN
  SELECT DATE_TRUNC('month', ar_credits_reset_date) < DATE_TRUNC('month', NOW())
  INTO v_reset_needed
  FROM users
  WHERE id = p_user_id
  FOR UPDATE; -- Lock para evitar race conditions
  
  IF v_reset_needed THEN
    UPDATE users
    SET ar_credits_used = 0,
        ar_credits_reset_date = NOW()
    WHERE id = p_user_id;
  END IF;
  
  SELECT (ar_credits - ar_credits_used)
  INTO v_available
  FROM users
  WHERE id = p_user_id;
  
  IF v_available < p_credits THEN
    RETURN QUERY SELECT 
      FALSE,
      v_available,
      'INSUFFICIENT_AR_CREDITS'::TEXT;
    RETURN;
  END IF;
  
  UPDATE users
  SET ar_credits_used = ar_credits_used + p_credits,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  SELECT (ar_credits - ar_credits_used)
  INTO v_available
  FROM users
  WHERE id = p_user_id;
  
  INSERT INTO ar_credits_usage_log (
    user_id,
    feature_type,
    credits_consumed,
    credits_remaining,
    metadata
  ) VALUES (
    p_user_id,
    p_feature_type,
    p_credits,
    v_available,
    p_metadata
  );
  
  RETURN QUERY SELECT 
    TRUE,
    v_available,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql;


INSERT INTO audit_logs (event, description, metadata, created_at)
VALUES (
  'AR_CREDITS_UNIFICATION',
  'Unificación de créditos AR: uñas + peinados + maquillaje = 50 créditos/mes',
  jsonb_build_object(
    'migration_version', '067',
    'features_included', ARRAY['nails', 'hairstyle', 'makeup'],
    'credits_per_month', 50,
    'old_system', jsonb_build_object(
      'nails_limit', 100,
      'hairstyle_limit', 4
    ),
    'new_system', jsonb_build_object(
      'unified_credits', 50,
      'flexible_usage', true
    )
  ),
  NOW()
);

COMMIT;
