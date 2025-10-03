ALTER TABLE user_quotas 
ADD COLUMN IF NOT EXISTS items_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS equipment_loans_active INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_item_request TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_user_quotas_items_used ON user_quotas(items_used_this_month);
CREATE INDEX IF NOT EXISTS idx_user_quotas_loans_active ON user_quotas(equipment_loans_active);
