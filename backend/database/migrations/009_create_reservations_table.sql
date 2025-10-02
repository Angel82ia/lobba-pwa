-- Reservations table for salon bookings
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  salon_profile_id UUID NOT NULL REFERENCES salon_profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES salon_services(id) ON DELETE CASCADE,
  
  -- Timing
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  buffer_minutes INTEGER DEFAULT 15,
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  
  -- Additional info
  notes TEXT,
  client_phone VARCHAR(50),
  client_email VARCHAR(255),
  
  -- Payments
  deposit_paid BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(10, 2),
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Integration
  google_calendar_event_id VARCHAR(255),
  
  -- Timestamps
  confirmed_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT check_end_after_start CHECK (end_time > start_time),
  CONSTRAINT check_positive_price CHECK (total_price >= 0)
);

-- Indexes for performance
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_salon_id ON reservations(salon_profile_id);
CREATE INDEX idx_reservations_service_id ON reservations(service_id);
CREATE INDEX idx_reservations_start_time ON reservations(start_time);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_salon_time ON reservations(salon_profile_id, start_time);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_reservation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservation_updated_at();
