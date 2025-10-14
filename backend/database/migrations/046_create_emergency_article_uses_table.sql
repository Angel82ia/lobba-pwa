
CREATE TABLE IF NOT EXISTS emergency_article_uses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  membership_type VARCHAR(20) NOT NULL CHECK (membership_type IN ('essential', 'spirit')),
  
  commerce_id VARCHAR(100),
  commerce_name VARCHAR(255),
  
  article_type VARCHAR(20) NOT NULL CHECK (article_type IN ('tampon', 'pad')),
  
  used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  month VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM' for monthly control
  
  remaining_this_month INTEGER NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_remaining_positive CHECK (remaining_this_month >= 0)
);

CREATE INDEX idx_emergency_article_uses_user_id ON emergency_article_uses(user_id);
CREATE INDEX idx_emergency_article_uses_month ON emergency_article_uses(month);
CREATE INDEX idx_emergency_article_uses_user_month ON emergency_article_uses(user_id, month);
CREATE INDEX idx_emergency_article_uses_used_at ON emergency_article_uses(used_at);

CREATE OR REPLACE FUNCTION set_emergency_article_month()
RETURNS TRIGGER AS $$
BEGIN
  NEW.month = TO_CHAR(NEW.used_at, 'YYYY-MM');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_emergency_article_set_month
BEFORE INSERT ON emergency_article_uses
FOR EACH ROW
EXECUTE PROCEDURE set_emergency_article_month();

COMMENT ON TABLE emergency_article_uses IS 'Tracks emergency article usage (2 Essential, 4 Spirit per month)';
COMMENT ON COLUMN emergency_article_uses.month IS 'YYYY-MM format for monthly limit tracking';
COMMENT ON COLUMN emergency_article_uses.remaining_this_month IS 'Articles remaining after this use';
COMMENT ON COLUMN emergency_article_uses.article_type IS 'Type of emergency article (tampon or pad)';
