
CREATE TABLE IF NOT EXISTS powerbank_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  powerbank_id VARCHAR(100) NOT NULL,
  
  commerce_id VARCHAR(100),
  commerce_name VARCHAR(255),
  
  loan_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  return_date TIMESTAMP,
  status VARCHAR(20) CHECK (status IN ('active', 'returned', 'overdue', 'lost')) DEFAULT 'active',
  
  hours_elapsed INTEGER,
  
  penalty_applied BOOLEAN DEFAULT false,
  penalty_amount DECIMAL(10, 2) DEFAULT 0.00,
  penalty_reason TEXT,
  
  notifications_sent JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_penalty_positive CHECK (penalty_amount >= 0),
  CONSTRAINT check_hours_positive CHECK (hours_elapsed IS NULL OR hours_elapsed >= 0)
);

CREATE INDEX idx_powerbank_loans_user_id ON powerbank_loans(user_id);
CREATE INDEX idx_powerbank_loans_status ON powerbank_loans(status);
CREATE INDEX idx_powerbank_loans_loan_date ON powerbank_loans(loan_date);
CREATE INDEX idx_powerbank_loans_powerbank_id ON powerbank_loans(powerbank_id);

CREATE INDEX idx_powerbank_loans_active ON powerbank_loans(user_id, status) 
WHERE status = 'active';

CREATE INDEX idx_powerbank_loans_overdue_check ON powerbank_loans(loan_date, status)
WHERE status = 'active';

CREATE OR REPLACE FUNCTION update_powerbank_loans_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_powerbank_loans_updated
BEFORE UPDATE ON powerbank_loans
FOR EACH ROW
EXECUTE PROCEDURE update_powerbank_loans_timestamp();

CREATE OR REPLACE FUNCTION calculate_powerbank_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.return_date IS NOT NULL AND OLD.return_date IS NULL THEN
    NEW.hours_elapsed = EXTRACT(EPOCH FROM (NEW.return_date - NEW.loan_date)) / 3600;
    
    IF NEW.hours_elapsed > 24 THEN
      NEW.penalty_applied = true;
      NEW.penalty_amount = 10.00; -- 10€ penalty
      NEW.penalty_reason = 'Returned after 24 hours';
      NEW.status = 'returned';
    ELSE
      NEW.status = 'returned';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_powerbank_calculate_penalty
BEFORE UPDATE ON powerbank_loans
FOR EACH ROW
EXECUTE PROCEDURE calculate_powerbank_hours();

COMMENT ON TABLE powerbank_loans IS 'Tracks powerbank loans with automatic penalty calculation after 24h';
COMMENT ON COLUMN powerbank_loans.hours_elapsed IS 'Hours between loan and return, calculated automatically';
COMMENT ON COLUMN powerbank_loans.penalty_amount IS '10€ if returned after 24 hours';
COMMENT ON COLUMN powerbank_loans.notifications_sent IS 'Array of {type, sentAt} for reminders sent';
