
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

CREATE OR REPLACE FUNCTION generate_user_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code VARCHAR(50);
  code_exists BOOLEAN;
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      new_code := 'LOBBA' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
      
      SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = new_code) INTO code_exists;
      
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    NEW.referral_code := new_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_generate_referral_code
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE PROCEDURE generate_user_referral_code();

DO $$
DECLARE
  user_record RECORD;
  new_code VARCHAR(50);
  code_exists BOOLEAN;
BEGIN
  FOR user_record IN SELECT id FROM users WHERE referral_code IS NULL LOOP
    LOOP
      new_code := 'LOBBA' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
      
      SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = new_code) INTO code_exists;
      
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    UPDATE users SET referral_code = new_code WHERE id = user_record.id;
  END LOOP;
END;
$$;

COMMENT ON COLUMN users.referral_code IS 'Unique code for referring other users (format: LOBBAXXXXXX)';
COMMENT ON COLUMN users.referred_by IS 'User ID who referred this user (NULL if organic)';
