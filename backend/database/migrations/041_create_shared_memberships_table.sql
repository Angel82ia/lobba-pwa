CREATE TABLE IF NOT EXISTS shared_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  shared_with_name TEXT NOT NULL,
  shared_with_birthdate DATE NOT NULL,
  relation TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_shared_memberships_membership_id ON shared_memberships(membership_id);
CREATE INDEX idx_shared_memberships_created_by ON shared_memberships(created_by);
CREATE INDEX idx_shared_memberships_status ON shared_memberships(status);

CREATE UNIQUE INDEX idx_shared_memberships_unique_active 
ON shared_memberships(membership_id, shared_with_name) 
WHERE status = 'active';

CREATE OR REPLACE FUNCTION update_shared_memberships_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_shared_memberships_updated
BEFORE UPDATE ON shared_memberships
FOR EACH ROW
EXECUTE PROCEDURE update_shared_memberships_timestamp();

ALTER TABLE shared_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared_membership_owner_policy" 
ON shared_memberships
FOR ALL
USING (created_by = auth.uid() OR auth.role() = 'service_role')
WITH CHECK (created_by = auth.uid() OR auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS membership_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  payload JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_membership_audit_user_id ON membership_audit(user_id);
CREATE INDEX idx_membership_audit_action ON membership_audit(action);
CREATE INDEX idx_membership_audit_created_at ON membership_audit(created_at);
