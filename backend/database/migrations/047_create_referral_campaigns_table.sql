
CREATE TABLE IF NOT EXISTS referral_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  host_referral_code VARCHAR(50) NOT NULL,
  
  status VARCHAR(20) CHECK (status IN ('in_progress', 'completed', 'expired')) DEFAULT 'in_progress',
  completed_at TIMESTAMP,
  
  free_months_granted BOOLEAN DEFAULT false,
  raffle_entry_granted BOOLEAN DEFAULT false,
  raffle_quarter VARCHAR(10), -- Format: 'Q1-2025', 'Q2-2025', etc.
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referral_campaign_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES referral_campaigns(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  membership_chosen VARCHAR(20) CHECK (membership_chosen IN ('essential', 'spirit')),
  
  status VARCHAR(20) CHECK (status IN ('pending_payment', 'completed')) DEFAULT 'pending_payment',
  completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_referral_entry UNIQUE(campaign_id, referred_user_id)
);

CREATE TABLE IF NOT EXISTS raffle_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES referral_campaigns(id) ON DELETE SET NULL,
  
  quarter VARCHAR(10) NOT NULL, -- 'Q1-2025', 'Q2-2025', etc.
  entry_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  is_winner BOOLEAN DEFAULT false,
  won_at TIMESTAMP,
  prize VARCHAR(100), -- '1 year free membership'
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_raffle_entry UNIQUE(user_id, quarter)
);

CREATE INDEX idx_referral_campaigns_host_user ON referral_campaigns(host_user_id);
CREATE INDEX idx_referral_campaigns_status ON referral_campaigns(status);
CREATE INDEX idx_referral_campaigns_code ON referral_campaigns(host_referral_code);

CREATE INDEX idx_referral_entries_campaign ON referral_campaign_entries(campaign_id);
CREATE INDEX idx_referral_entries_user ON referral_campaign_entries(referred_user_id);
CREATE INDEX idx_referral_entries_status ON referral_campaign_entries(status);

CREATE INDEX idx_raffle_entries_user ON raffle_entries(user_id);
CREATE INDEX idx_raffle_entries_quarter ON raffle_entries(quarter);
CREATE INDEX idx_raffle_entries_winner ON raffle_entries(is_winner);

CREATE OR REPLACE FUNCTION update_referral_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_referral_campaigns_updated
BEFORE UPDATE ON referral_campaigns
FOR EACH ROW
EXECUTE PROCEDURE update_referral_timestamp();

CREATE TRIGGER trg_referral_entries_updated
BEFORE UPDATE ON referral_campaign_entries
FOR EACH ROW
EXECUTE PROCEDURE update_referral_timestamp();

CREATE OR REPLACE FUNCTION check_campaign_completion()
RETURNS TRIGGER AS $$
DECLARE
  completed_count INTEGER;
  campaign_record RECORD;
BEGIN
  SELECT COUNT(*) INTO completed_count
  FROM referral_campaign_entries
  WHERE campaign_id = NEW.campaign_id AND status = 'completed';
  
  IF completed_count >= 4 THEN
    SELECT * INTO campaign_record FROM referral_campaigns WHERE id = NEW.campaign_id;
    
    IF campaign_record.status = 'in_progress' THEN
      UPDATE referral_campaigns
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = NEW.campaign_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_campaign_completion
AFTER UPDATE ON referral_campaign_entries
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE PROCEDURE check_campaign_completion();

COMMENT ON TABLE referral_campaigns IS 'Tracks referral campaigns (refer 4 friends = rewards)';
COMMENT ON TABLE referral_campaign_entries IS 'Individual referrals within a campaign';
COMMENT ON TABLE raffle_entries IS 'Quarterly raffle entries for completed campaigns';
COMMENT ON COLUMN referral_campaigns.free_months_granted IS 'True when all 5 users got their free month';
COMMENT ON COLUMN referral_campaigns.raffle_entry_granted IS 'True when host got raffle entry';
