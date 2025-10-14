
CREATE OR REPLACE FUNCTION sync_membership_to_users()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET 
    membership_active = (NEW.status = 'active'),
    membership_status = NEW.status
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_membership_to_users
AFTER INSERT OR UPDATE OF status ON memberships
FOR EACH ROW
EXECUTE PROCEDURE sync_membership_to_users();

CREATE OR REPLACE FUNCTION create_monthly_limits_for_membership()
RETURNS TRIGGER AS $$
DECLARE
  emergency_limit INTEGER;
  powerbank_limit INTEGER;
  ems_limit INTEGER;
BEGIN
  IF NEW.plan_type = 'spirit' THEN
    emergency_limit := 4;
    powerbank_limit := 4;
    ems_limit := 2;
  ELSE -- essential
    emergency_limit := 2;
    powerbank_limit := 2;
    ems_limit := 0;
  END IF;
  
  INSERT INTO monthly_limits (
    membership_id,
    emergency_articles,
    emergency_articles_used,
    powerbanks,
    powerbanks_used,
    nail_prints,
    nail_prints_used,
    ems_sessions,
    ems_sessions_used,
    last_reset_date
  ) VALUES (
    NEW.id,
    emergency_limit,
    0,
    powerbank_limit,
    0,
    100, -- Both Essential and Spirit get 100 nail prints
    0,
    ems_limit,
    0,
    CURRENT_TIMESTAMP
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_monthly_limits
AFTER INSERT ON memberships
FOR EACH ROW
EXECUTE PROCEDURE create_monthly_limits_for_membership();

CREATE OR REPLACE FUNCTION create_monthly_shipment_for_membership()
RETURNS TRIGGER AS $$
DECLARE
  units INTEGER;
BEGIN
  IF NEW.plan_type = 'spirit' THEN
    units := 32;
  ELSE -- essential
    units := 16;
  END IF;
  
  INSERT INTO monthly_shipments (
    membership_id,
    units_per_month,
    next_shipment_date,
    status
  ) VALUES (
    NEW.id,
    units,
    CURRENT_TIMESTAMP + INTERVAL '3 days', -- Ship 3 days after subscription
    'pending'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_monthly_shipment
AFTER INSERT ON memberships
FOR EACH ROW
EXECUTE PROCEDURE create_monthly_shipment_for_membership();

COMMENT ON FUNCTION sync_membership_to_users IS 'Keeps users.membership_active and users.membership_status in sync with memberships table';
COMMENT ON FUNCTION create_monthly_limits_for_membership IS 'Auto-creates monthly_limits when new membership is created';
COMMENT ON FUNCTION create_monthly_shipment_for_membership IS 'Auto-creates monthly_shipment record when new membership is created';
