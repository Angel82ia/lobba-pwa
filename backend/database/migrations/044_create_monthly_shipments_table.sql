
CREATE TABLE IF NOT EXISTS monthly_shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  
  units_per_month INTEGER NOT NULL,
  last_shipment_date TIMESTAMP,
  next_shipment_date TIMESTAMP NOT NULL,
  
  shipping_address JSONB,
  
  tracking_number VARCHAR(100),
  carrier VARCHAR(50),
  status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'failed')) DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_units_valid CHECK (units_per_month IN (16, 32))
);

CREATE INDEX idx_monthly_shipments_membership_id ON monthly_shipments(membership_id);
CREATE INDEX idx_monthly_shipments_next_date ON monthly_shipments(next_shipment_date);
CREATE INDEX idx_monthly_shipments_status ON monthly_shipments(status);

CREATE UNIQUE INDEX idx_monthly_shipments_unique_membership ON monthly_shipments(membership_id);

CREATE OR REPLACE FUNCTION update_monthly_shipments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_monthly_shipments_updated
BEFORE UPDATE ON monthly_shipments
FOR EACH ROW
EXECUTE PROCEDURE update_monthly_shipments_timestamp();

COMMENT ON TABLE monthly_shipments IS 'Tracks monthly shipments for memberships';
COMMENT ON COLUMN monthly_shipments.units_per_month IS 'Number of units in monthly shipment (16 Essential, 32 Spirit)';
COMMENT ON COLUMN monthly_shipments.shipping_address IS 'JSON with address details {street, city, postalCode, country}';
